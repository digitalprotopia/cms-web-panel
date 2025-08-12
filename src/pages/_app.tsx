/* eslint-disable react/jsx-no-constructed-context-values */
import './globals.css';
import '../components/BlockEditorWidget.css';
import client from '@/components/apollo-client';
import {
  createTheme,
  StyledEngineProvider,
  ThemeProvider,
} from '@mui/material';

import {
  ApolloClient, ApolloProvider, gql, NormalizedCacheObject,
  useQuery,
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
import { IUser } from '@/components/entities/IUser';
import UserContext from '@/components/UserContext';
import { ISiteItem } from '@/components/entities/ISiteItem';
import { YMaps } from '@pbe/react-yandex-maps';
import { PageProvider } from '@/components/PageContext';

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

interface MeQueryResponse {
  me: IUser;
}

const GET_ME = gql`
  query GetMe {
    me {
      id
      name
      phone
      avatar { id extension }
      role {
        id
        name
      }
    }
  }
`;

function CMSLayout({
  Component,
}: Readonly<{
  Component: React.FC;
  params: any;
}>) {
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState<ISiteItem | null>(null);

  const [loaded, setLoaded] = useState(false);

  const {
    data, refetch, error, loading,
  } = useQuery<MeQueryResponse>(GET_ME);

  useEffect(() => {
    document.getElementById('first-loader')?.remove();
  }, []);

  useEffect(() => {
    if (router.pathname.startsWith('/admin') || router.pathname.startsWith('/auth')) {
      setCurrentPage(null);
    }
  }, [router.pathname]);

  const pages = useQuery(gql`
    query($domain: String!) {
        getSiteByDomain(domain: $domain) {
          id
          title
          siteItems {
            id
            title
            url
            parentId
            isRoot
            is404
            type
            createdAt
          }
          templateGroup {
            templates {
              id
              name
              html
              type
              blockContent
              createdAt
            }
          }
            
        }
    }
    `, {
    variables: {
      domain: window.config.domain,
    },
  });

  if (!loading && (error || !data?.me)) {
    localStorage.removeItem('token');
  }

  let pageLayouts = <Component />;
  if (router.pathname.startsWith('/admin')) {
    pageLayouts = <AdminLayout>{pageLayouts}</AdminLayout>;
  } else if (router.pathname.startsWith('/auth')) {
    //
  } else {
    pageLayouts = <IndexLayout>{pageLayouts}</IndexLayout>;
  }

  return (
    <YMaps query={{
      apikey: window.config.yandexKey,
      load: 'package.full',
    }}
    >
      <div className={`${inter.variable} antialiased h-full`}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <SnackbarProvider maxSnack={3}>
              <div className="size-full flex flex-col text-base">
                <UserContext.Provider value={{
                  user: error ? null : data?.me as IUser,
                  loaded,
                  setLoaded,
                  refetch: async () => {
                    await refetch();
                    await pages.refetch();
                  },
                  logout: async () => {
                    localStorage.removeItem('token');
                    try {
                      router.push('/');
                      await refetch();
                      await pages.refetch();
                    } catch (e) {
                      console.error(e);
                    }
                  },
                  pages: (pages.data?.getSiteByDomain?.siteItems || []) as ISiteItem[],
                  site: pages.data?.getSiteByDomain || {
                    templateGroup: {
                      templates: [],
                    },
                  },
                  currentPage,
                  setCurrentPage,
                }}
                >
                  <PageProvider>
                    {pageLayouts}
                  </PageProvider>
                </UserContext.Provider>
              </div>
            </SnackbarProvider>
          </ThemeProvider>
        </StyledEngineProvider>
      </div>
    </YMaps>
  );
}

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
