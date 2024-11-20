'use client';

import { use } from 'react';
import {
  Typography,
} from '@mui/material';
import { gql, useQuery } from '@apollo/client';

import ParsePage from '@/components/ParsePage';

const GET_SITEITEM_BY_URL = gql`
  query GetSiteItemByUrl($url: String!) {
    getSiteItemByUrl(url: $url) {
      url
      title
      html
      id
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

  return (
    <>
      <style>
        {`.page a{
          text-decoration: underline;
        }`}
      </style>
      <div className="page">
        {(error || !siteItem?.getSiteItemByUrl) ? '404'
          : (
            <div>
              <Typography variant="h4">{siteItem.getSiteItemByUrl.title}</Typography>
              <ParsePage html={siteItem.getSiteItemByUrl.html} />
            </div>
          )}
      </div>
    </>
  );
}

export default DynamicPage;
