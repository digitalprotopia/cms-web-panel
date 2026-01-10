/* eslint-disable react/jsx-no-constructed-context-values */
import './globals.css';
import '../components/BlockEditorWidget.css';

import client from '@/components/apollo-client';

import {
  ApolloClient, ApolloProvider, NormalizedCacheObject,
} from '@apollo/client';

import '../i18n/i18n';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import config from '@/config/config';

const CMSLayout = dynamic(() => import('@/components/_appAsync'), {
  ssr: false,
});

export default function CMSLayoutApollo({
  Component,
  params,
}: Readonly<{
  Component: React.FC;
  params: any;
}>) {
  const [clientCached, setClientCached] = useState<
  ApolloClient<NormalizedCacheObject> | null>(null);

  useEffect(() => {
    (async () => {
      const _config = await config();
      console.log(_config);

      window.config = _config;

      window.CachedImport = {
        Mui: await import('@mui/material'),
        babelTransform: (await import('@babel/standalone')).transform,
      };

      setClientCached(client(`${_config.server}/graphql`));
    })();
  }, []);

  if (clientCached === null) {
    return null;
  }

  return (
    <ApolloProvider client={clientCached}>
      <CMSLayout Component={Component} params={params} />
    </ApolloProvider>
  );
}
