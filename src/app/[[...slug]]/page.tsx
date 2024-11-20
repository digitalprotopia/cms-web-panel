'use client';

import { use } from 'react';
import {
  Typography,
} from '@mui/material';
import { gql, useQuery } from '@apollo/client';

import ParsePage from '@/components/ParsePage';
import DynamicParse from '@/components/DynamicParse';
import Link from 'next/link';

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

  const args = {
    content:
  <div className="page">
    {(error || !siteItem?.getSiteItemByUrl) ? '404'
      : (
        <div>
          <Typography variant="h4">{siteItem.getSiteItemByUrl.title}</Typography>
          <ParsePage html={siteItem.getSiteItemByUrl.html} />
        </div>
      )}
  </div>,
    menu: siteItem?.getAllSiteItems.map((item) => (
      <Link key={item.url} href={item.url}>
        <span className="mx-3">{item.title}</span>
      </Link>
    )),
  };

  const site = siteItem?.getAllSites?.[0];
  const template = site?.templateGroup?.templates?.find((template) => template.name === 'layout');
  const html = template ? template.html : `<div>
  <div>{menu}</div>
  <div>{content}</div>
  </div>`;

  return (
    <>
      <style>
        {`.page a{
          text-decoration: underline;
        }`}
      </style>
      <DynamicParse html={html} replace={args} />
    </>
  );
}

export default DynamicPage;
