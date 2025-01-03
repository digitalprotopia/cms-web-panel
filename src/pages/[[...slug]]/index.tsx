import { gql, useQuery } from '@apollo/client';

import ParsePage from '@/components/ParsePage';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import UserContext from '@/components/UserContext';
import { ISiteItem, SiteItemType } from '@/components/entities/ISiteItem';
import { ITemplate } from '@/components/entities/ITemplate';
import Head from 'next/head';
import BlockEditor from '@/components/BlockEditor';

const GET_SITEITEM = gql`
  query GetSiteItem($id: ID!) {
    getSiteItem(id: $id) {
      url
      title
      html
      blockContent
      id
    }
    getAllSites {
      templateGroup {
        templates {
          id
          name
          html
          createdAt
        }
      }
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

  return template.html.replace(/\{include:([a-zA-Z0-9_]+)\}/g, (match) => {
    const name = match.replace(/\{include:([a-zA-Z0-9_]+)\}/, '$1');
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

  const { data: siteItem, loading: siteItemLoading } = useQuery(
    GET_SITEITEM,
    {
      variables: { id: currentPage },
      skip: !currentPage,
    },
  );

  if (siteItemLoading) return <span>Loading...</span>;

  const site = siteItem?.getAllSites?.[0];
  const template = site?.templateGroup?.templates?.find((_template: any) => _template.name === 'layout');
  let html = template ? renderTemplate(template, site?.templateGroup?.templates) : `<div>
  <div>{menu}</div>
  <div>{content}</div>
  </div>`;

  html = html.replace('{content}', `  <div className="page">
    <div>
      ${siteItem?.getSiteItem?.html || ''}
      {blockContent}
    </div>
  </div>`);

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
    blockContent: <BlockEditor
      initialData={siteItem?.getSiteItem.blockContent}
      onChange={() => {}}
      isEditable={false}
    />,
  };

  return (
    <>
      <style>
        {`.page a{
          text-decoration: underline;
        }`}
      </style>
      <Head><title>{siteItem?.getSiteItem?.title || ''}</title></Head>
      <ParsePage html={html} args={args} />
    </>
  );
}

export default DynamicPage;
