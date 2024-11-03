'use client';

import { useMemo, use, useState } from 'react';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Button, IconButton, TextField } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { gql, useApolloClient, useQuery } from '@apollo/client';

import DynamicParse from '@/components/DynamicParse';
import ParsePage from '@/components/ParsePage';

const GET_SITEITEM_BY_URL = gql`
  query GetSiteItemByUrl($url: String!) {
    getSiteItemByUrl(url: $url) {
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
      variables: { url: slug[0] },
    },
  );

  if (siteItemLoading) return <span>Loading...</span>;

  return (
    <div>
      {(error || !siteItem?.getSiteItemByUrl) ? '404'
        : <ParsePage html={siteItem?.getSiteItemByUrl.html} />}
    </div>
  );
}

export default DynamicPage;
