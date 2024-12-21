import React from 'react';
import { useRouter } from 'next/router';
import { gql, useQuery } from '@apollo/client';
import {
  CircularProgress,
  Typography,
  IconButton,
  Button,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import OpenInNew from '@mui/icons-material/OpenInNew';
import { ISite } from '@/components/entities/ISite';

const GET_SITE = gql`
  query getSite($id: ID!) {
    getSite(id: $id) {
      id
      title
      favicon
      domain
      templateGroupId
      platformId
      createdAt
      updatedAt
    }
  }
`;

function SitePage() {
  const router = useRouter();
  const { id } = router.query;

  const { data, loading, error } = useQuery(GET_SITE, {
    variables: { id },
    skip: !id,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  if (error || !data?.getSite) {
    return (
      <div className="p-4">
        <Typography color="error">Error loading site details</Typography>
      </div>
    );
  }

  const site: ISite = data.getSite;

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <div className="flex items-center gap-4 mb-6">
        <IconButton onClick={() => router.back()}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">{site.title}</Typography>
        <Button
          variant="outlined"
          startIcon={<OpenInNew />}
          onClick={() => window.open(`https://${site.domain}`, '_blank')}
        >
          Open Site
        </Button>
      </div>

      <div className="grid gap-4">
        <Typography variant="body1">
          <strong>Domain:</strong>
          {' '}
          {site.domain}
        </Typography>
        <Typography variant="body1">
          <strong>Created:</strong>
          {' '}
          {new Date(parseInt(String(site.createdAt), 10)).toLocaleString()}
        </Typography>
        <Typography variant="body1">
          <strong>Last Updated:</strong>
          {' '}
          {new Date(parseInt(String(site.updatedAt), 10)).toLocaleString()}
        </Typography>
      </div>
    </div>
  );
}

export default SitePage;
