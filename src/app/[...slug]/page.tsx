"use client";

import { useMemo } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { Button, IconButton, TextField } from "@mui/material";
import { Delete } from "@mui/icons-material";
import { gql, useApolloClient, useQuery } from "@apollo/client";
import { use, useState } from "react";
import DynamicParse from "@/components/DynamicParse";

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

  const { data: siteItem, loading: siteItemLoading } = useQuery(
    GET_SITEITEM_BY_URL,
    {
      variables: { url: slug[0] },
    },
  );

  if (siteItemLoading) return <span>Loading...</span>;

  return (
    <div>
      <DynamicParse html={siteItem?.getSiteItemByUrl.html} replace={{}} />
    </div>
  );
}

export default DynamicPage;
