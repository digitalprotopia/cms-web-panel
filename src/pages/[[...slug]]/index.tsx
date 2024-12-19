import {
  Typography,
} from '@mui/material';
import { gql, useQuery } from '@apollo/client';

import ParsePage from '@/components/ParsePage';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import UserContext from '@/components/UserContext';
import { ISiteItem, SiteItemType } from '@/components/entities/ISiteItem';

const GET_SITEITEM = gql`
  query GetSiteItem($id: ID!) {
    getSiteItem(id: $id) {
      url
      title
      html
      id
    }
    getAllSites {
      templateGroup {
        templates {
          name
          html
        }
      }
    }
  }
`;

function DynamicPage() {
  const [currentPage, setCurrentPage] = useState<string | null>(null);

  const user = useContext(UserContext);
  const pages = user.pages || [];

  const slug = useRouter().query.slug as string[];

  useEffect(() => {
    let prevPage = '';
    if (!slug || !slug.length) {
      setCurrentPage(pages.find((p) => p.url === '' && !p.parentId)?.id || null);
      return;
    }
    for (const i in slug) {
      const item = slug[i];
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

  const { data: siteItem, loading: siteItemLoading, error } = useQuery(
    GET_SITEITEM,
    {
      variables: { id: currentPage },
      skip: !currentPage,
    },
  );

  if (siteItemLoading) return <span>Loading...</span>;

  const site = siteItem?.getAllSites?.[0];
  const template = site?.templateGroup?.templates?.find((_template: any) => _template.name === 'layout');
  let html = template ? template.html : `<div>
  <div>{menu}</div>
  <div>{content}</div>
  </div>`;

  if (error || !siteItem?.getSiteItem) {
    return (
      <div className="page">
        404
      </div>
    );
  }

  html = html.replace('{content}', `  <div className="page">
    <div>
      {title}
      ${siteItem?.getSiteItem?.html || ''}
    </div>
  </div>`);

  const args = {
    menu: user.pages?.map((item) => {
      let { url } = item;
      let currentItem: (ISiteItem | null) = item;
      while (currentItem?.parentId) {
        currentItem = pages.find((p) => p.id === currentItem.parentId) || null;
        url = `${currentItem?.url}/${url}`;
      }
      return (
        <Link key={url} href={url}>
          <span className="mx-3">{item.title}</span>
        </Link>
      );
    }) || [],
    title:
  <Typography variant="h4">
    {siteItem.getSiteItem.title}
  </Typography>,
  };

  return (
    <>
      <style>
        {`.page a{
          text-decoration: underline;
        }`}
      </style>
      <ParsePage html={html} args={args} />
    </>
  );
}

export default DynamicPage;
