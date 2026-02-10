import { gql, useQuery } from '@apollo/client';

// import ParsePage from '@/components/ParsePage';
import { useRouter } from 'next/router';
import {
  useContext, useEffect, useMemo, useState,
} from 'react';
import UserContext from '@/components/UserContext';
import { ISiteItem, SiteItemType } from '@/components/entities/ISiteItem';
import { ITemplate, TemplateType } from '@/components/entities/ITemplate';
import Head from 'next/head';
import parse from 'html-react-parser';
import { usePageContext } from '@/components/PageContext';
import dynamic from 'next/dynamic';

const BlockView = dynamic(() => import('@/components/BlockEditor').then((mod) => mod.BlockView));

const GET_SITEITEM = gql`
  query GetSiteItem($id: ID!) {
    getSiteItem(id: $id) {
      url
      title
      html
      preview
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

  return (template.html || '').replace(/\{include:([a-zA-Z0-9_./]+)\}/g, (match) => {
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
      prevPage = pages.find((p) => p.url === '' && !p.parentId)?.id || '';
    } else {
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
    }
    if (!prevPage) {
      prevPage = pages.find((p) => p.is404 === true)?.id || '';
    }
    setCurrentPage(prevPage);
  }, [pages, slug]);

  const { site } = user;

  const template = site?.templateGroup?.templates?.find((_template: any) => _template.name === 'layout');

  const { data: siteItem } = useQuery(
    GET_SITEITEM,
    {
      variables: { id: currentPage },
      skip: !currentPage,
      onCompleted: () => {
        if (!user.user?.id) {
          user.setLoaded(true);
        }
      },
    },
  );

  const pageContext = usePageContext();

  useEffect(() => {
    pageContext.clearData();
  }, [siteItem]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [loaded, setLoaded] = useState(false);
  const [disablePreview, setDisablePreview] = useState(false);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setTimeout(() => {
      setLoaded(true);
      setTimeout(() => {
        setDisablePreview(true);
      }, 4000);
    }, 2000);
  }, []);

  const showPreview = !user.user?.id
  && siteItem?.getSiteItem?.preview && !disablePreview;
  const hideReal = !user.user?.id
  && !loaded && siteItem?.getSiteItem?.preview;

  useEffect(() => {
    user.setIsPreview(showPreview);
  }, [showPreview]);

  const parsedHead = useMemo(() => {
    const headTemplate = site?.templateGroup?.templates?.find((_template: any) => _template.name === 'head');
    const head = headTemplate ? renderTemplate(headTemplate, site?.templateGroup?.templates) : '';
    if (!head) {
      return null;
    }
    return parse(head);
  }, [site?.templateGroup?.templates]);

  if (!site || !siteItem?.getSiteItem) return null;

  // let html = template ? renderTemplate(template, site?.templateGroup?.templates) : `<div>
  // <div>{menu}</div>
  // <div>{content}</div>
  // </div>`;

  // html = html.replace('{content}', `  <div className="page">
  //   <div id="page-content">
  //     ${siteItem?.getSiteItem?.html || ''}
  //     {blockContent}
  //   </div>
  // </div>`);

  // let blockContent:React.JSX.Element = <div />;

  // if (siteItemLoading) {
  //   blockContent = (
  //     <div
  //       style={{
  //         display: 'flex',
  //         width: '100%',
  //         justifyContent: 'center',
  //       }}
  //     >
  //       <CircularProgress />
  //     </div>
  //   );
  // }
  // if (siteItem) {
  //   blockContent = (
  //     <BlockEditor
  //       initialData={siteItem?.getSiteItem.blockContent}
  //       onChange={() => {}}
  //       isEditable={false}
  //     />
  //   );
  // }

  // const args = {
  //   menu: user.pages?.map((item) => {
  //     let { url } = item;
  //     let currentItem: (ISiteItem | null) = item;
  //     while (currentItem?.parentId) {
  //       // eslint-disable-next-line @typescript-eslint/no-loop-func
  //       currentItem = pages.find((p) => p.id === currentItem!.parentId) || null;
  //       url = `${currentItem?.url}/${url}`;
  //     }
  //     return (
  //       <Link key={url} href={url}>
  //         <span className="mx-3">{item.title}</span>
  //       </Link>
  //     );
  //   }) || [],
  //   title: siteItem?.getSiteItem?.title || '',
  //   blockContent,
  // };

  if (template?.type === TemplateType.BLOCKS) {
    return (
      <div className="mmcms-blocks-template">
        <Head>
          <title>{siteItem?.getSiteItem?.title || ''}</title>
          {parsedHead}
        </Head>
        {showPreview && (<div
          dangerouslySetInnerHTML={{
            __html: siteItem?.getSiteItem?.preview || '',
          }}
        />)}
        {hideReal ? null
          : (
            <div
              id="mmcms-page-content"
              style={{
                display: showPreview ? 'none' : 'block',
              }}
            >
              <BlockView
                blockContent={template?.blockContent}
              />
            </div>
          )}
      </div>
    );
  }

  return null;

  // return (
  //   <>
  //     <style>
  //       {`.page a{
  //         text-decoration: underline;
  //       }`}
  //     </style>
  //     <Head>
  //       <title>{siteItem?.getSiteItem?.title || ''}</title>
  //       {parse(head)}
  //     </Head>
  //     <ParsePage html={html} args={args} />
  //   </>
  // );
}

export default DynamicPage;
