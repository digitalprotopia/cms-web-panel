import './globals.css';
import client from '@/components/apollo-client';
import {
  createTheme,
  StyledEngineProvider,
  ThemeProvider,
} from '@mui/material';

import {
  ApolloClient, ApolloProvider, NormalizedCacheObject,
} from '@apollo/client';
import { SnackbarProvider } from 'notistack';
import tailwind from '@/../tailwind.config';
import { Roboto } from 'next/font/google';
import React, {
  useEffect, useState,
} from 'react';
import config from '@/config/config';

import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/admin';
import IndexLayout from '@/components/layouts';
import { Config } from '@/config/config.sample';

declare global {
  interface Window {
    config: Config;
  }
}

const inter = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: '--font-roboto',
  subsets: ['cyrillic-ext', 'latin'],
});

const theme = createTheme({
  palette: {
    primary: {
      main: (tailwind as any)?.theme?.extend?.colors?.cms?.primary,
      contrastText: '#ffffff',
    },
    secondary: {
      main: (tailwind as any)?.theme?.extend?.colors?.cms?.secondary,
      contrastText: '#4B5A73',
    },
    tertiary: {
      main: (tailwind as any)?.theme?.extend?.colors?.cms?.tertiary,
      contrastText: '#4B5A73',
    },
  },
} as any);

export default function CMSLayout({
  Component,
}: Readonly<{
  Component: React.FC;
  params: any;
}>) {
  const [clientCached, setClientCached] = useState<
  ApolloClient<NormalizedCacheObject> | null>(null);

  const router = useRouter();

  useEffect(() => {
    (async () => {
      const _config = await config();
      console.log(_config);
      window.config = _config;
      setClientCached(client(_config.server));
    })();
  }, []);

  if (clientCached === null) {
    return null;
  }

  let result = <Component />;
  if (router.pathname.startsWith('/admin')) {
    result = <AdminLayout>{result}</AdminLayout>;
  } else if (router.pathname.startsWith('/auth')) {
    //
  } else {
    result = <IndexLayout>{result}</IndexLayout>;
  }

  return (
    <div className={`${inter.variable} antialiased h-full`}>
      <ApolloProvider client={clientCached}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <SnackbarProvider maxSnack={3}>
              <div className="size-full flex flex-col text-base">
                {result}
              </div>
            </SnackbarProvider>
          </ThemeProvider>
        </StyledEngineProvider>
      </ApolloProvider>
    </div>
  );
}
