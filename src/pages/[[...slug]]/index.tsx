import { ReactNode, use } from 'react';
import {
  Typography,
} from '@mui/material';
import { gql, useQuery } from '@apollo/client';

import ParsePage from '@/components/ParsePage';
import DynamicParse from '@/components/DynamicParse';
import Link from 'next/link';
import reactStringReplace from 'react-string-replace';

const GET_SITEITEM_BY_URL = gql`
  query GetSiteItemByUrl($url: String!) {
    getSiteItemByUrl(url: $url) {
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
    getAllSiteItems {
      title
      url
    }
  }
`;
function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const { data: siteItem, loading: siteItemLoading, error } = useQuery(
    GET_SITEITEM_BY_URL,
    {
      variables: { url: slug?.[0] || '' },
    },
  );

  if (siteItemLoading) return <span>Loading...</span>;

  const site = siteItem?.getAllSites?.[0];
  const template = site?.templateGroup?.templates?.find((template) => template.name === 'layout');
  let html = template ? template.html : `<div>
  <div>{menu}</div>
  <div>{content}</div>
  </div>`;

  if (error || !siteItem?.getSiteItemByUrl) {
    return (
      <div className="page">
        404
      </div>
    );
  }

  html = html.replace('{content}', `  <div className="page">
    <div>
      {title}
      ${siteItem?.getSiteItemByUrl?.html || ''}
    </div>
  </div>`);

  const args = {
    menu: siteItem?.getAllSiteItems.map((item) => (
      <Link key={item.url} href={item.url}>
        <span className="mx-3">{item.title}</span>
      </Link>
    )),
    title:
  <Typography variant="h4">
    {siteItem.getSiteItemByUrl.title}
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
