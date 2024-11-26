import './globals.css';
import client from '@/components/apollo-client';
import {
  Avatar,
  Badge,
  Button,
  createTheme,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  StyledEngineProvider,
  ThemeProvider,
} from '@mui/material';

import {
  ApolloClient, ApolloProvider, NormalizedCacheObject, gql, useQuery,
} from '@apollo/client';
import { SnackbarProvider } from 'notistack';
import tailwind from '@/../tailwind.config';
import { Roboto } from 'next/font/google';
import React, {
  ReactNode, useEffect, useState, MouseEvent,
} from 'react';
import Link from 'next/link';
import config from '@/config/config';

import { useRouter } from 'next/router';
import { KeyboardArrowDownRounded, NotificationsNoneOutlined } from '@mui/icons-material';
import AdminLayout from '@/components/layouts/admin';
import IndexLayout from '@/components/layouts';

const inter = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: '--font-roboto',
  subsets: ['cyrillic-ext', 'latin'],
});

const theme = createTheme({
  palette: {
    primary: {
      main: tailwind?.theme?.extend?.colors?.cms?.primary,
      contrastText: '#ffffff',
    },
    secondary: {
      main: tailwind?.theme?.extend?.colors?.cms?.secondary,
      contrastText: '#4B5A73',
    },
    tertiary: {
      main: tailwind?.theme?.extend?.colors?.cms?.tertiary,
      contrastText: '#4B5A73',
    },
  },
});

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
