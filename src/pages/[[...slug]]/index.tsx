import { gql, useQuery } from '@apollo/client';

import ParsePage from '@/components/ParsePage';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Fragment, useContext, useEffect, useState,
} from 'react';
import UserContext from '@/components/UserContext';
import { ISiteItem, SiteItemType } from '@/components/entities/ISiteItem';
import { ITemplate, TemplateType } from '@/components/entities/ITemplate';
import Head from 'next/head';
import BlockEditor, { BlockView } from '@/components/BlockEditor';
import { CircularProgress } from '@mui/material';
import parse from 'html-react-parser';
import { usePageContext } from '@/components/PageContext';

const GET_SITEITEM = gql`
  query GetSiteItem($id: ID!) {
    getSiteItem(id: $id) {
      url
      title
      html
      blockContent
      id
    }
  }
`;

const renderTemplate = (
  template: ITemplate,
  templates: ITemplate[],
  templatesHistory: string[] = [],
): string => {
  if (templatesHistory.includes(template.id)) {
    return '';
  }
  templatesHistory.push(template.id);

  return template.html.replace(/\{include:([a-zA-Z0-9_./]+)\}/g, (match) => {
    const name = match.replace(/\{include:([a-zA-Z0-9_./]+)\}/, '$1');
    const nextTemplate = templates.find((t) => t.name === name);
    if (nextTemplate) {
      return renderTemplate(nextTemplate, templates, templatesHistory);
    }
    return '';
  });
};

function DynamicPage() {
  const [currentPage, setCurrentPage] = useState<string | null>(null);

  const user = useContext(UserContext);
  const pages = user.pages || [];

  const slug = useRouter().query.slug as string[];

  useEffect(() => {
    user.setCurrentPage!(currentPage
      ? pages.find((p) => p.id === currentPage) as (ISiteItem | null) : null);
  }, [currentPage]);

  useEffect(() => {
    let prevPage = '';
    if (!slug || !slug.length) {
      setCurrentPage(pages.find((p) => p.url === '' && !p.parentId)?.id || null);
      return;
    }
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const i in slug) {
      const item = slug[i];
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      const page = pages.find((p) => (p.type === SiteItemType.DYNAMIC || p.url === item)
        && ((!prevPage && !p.parentId) || p.parentId === prevPage));
      if (page) {
        prevPage = page.id;
      } else {
        prevPage = '';
        break;
      }
    }
    setCurrentPage(prevPage);
  }, [pages, slug]);

  const { site } = user;

  const template = site?.templateGroup?.templates?.find((_template: any) => _template.name === 'layout');

  const { data: siteItem, loading: siteItemLoading } = useQuery(
    GET_SITEITEM,
    {
      variables: { id: currentPage },
      skip: !currentPage || template?.type === TemplateType.BLOCKS,
    },
  );

  const pageContext = usePageContext();

  useEffect(() => {
    pageContext.clearData();
  }, [siteItem]);

  if (!site) return <span>Loading...</span>;

  let html = template ? renderTemplate(template, site?.templateGroup?.templates) : `<div>
  <div>{menu}</div>
  <div>{content}</div>
  </div>`;

  const headTemplate = site?.templateGroup?.templates?.find((_template: any) => _template.name === 'head');
  const head = headTemplate ? renderTemplate(headTemplate, site?.templateGroup?.templates) : '';

  html = html.replace('{content}', `  <div className="page">
    <div id="page-content">
      ${siteItem?.getSiteItem?.html || ''}
      {blockContent}
    </div>
  </div>`);

  let blockContent:React.JSX.Element = <div />;

  if (siteItemLoading) {
    blockContent = (
      <div
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </div>
    );
  }
  if (siteItem) {
    blockContent = (
      <BlockEditor
        initialData={siteItem?.getSiteItem.blockContent}
        onChange={() => {}}
        isEditable={false}
      />
    );
  }

  const args = {
    menu: user.pages?.map((item) => {
      let { url } = item;
      let currentItem: (ISiteItem | null) = item;
      while (currentItem?.parentId) {
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        currentItem = pages.find((p) => p.id === currentItem!.parentId) || null;
        url = `${currentItem?.url}/${url}`;
      }
      return (
        <Link key={url} href={url}>
          <span className="mx-3">{item.title}</span>
        </Link>
      );
    }) || [],
    title: siteItem?.getSiteItem?.title || '',
    blockContent,
  };

  if (template?.type === TemplateType.BLOCKS) {
    return (
      <div className="mmcms-blocks-template">
        <BlockView
          blockContent={template?.blockContent}
        />
      </div>
    );
  }

  return (
    <>
      <style>
        {`.page a{
          text-decoration: underline;
        }`}
      </style>
      <Head>
        <title>{siteItem?.getSiteItem?.title || ''}</title>
        {parse(head)}
      </Head>
      <ParsePage html={html} args={args} />
    </>
  );
}

export default DynamicPage;
