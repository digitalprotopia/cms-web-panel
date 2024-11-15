'use client';

import './globals.css';
import client from '@/components/apollo-client';
import {
  createTheme,
  StyledEngineProvider,
  ThemeProvider,
} from '@mui/material';
import { ApolloClient, ApolloProvider, NormalizedCacheObject } from '@apollo/client';
import { SnackbarProvider } from 'notistack';
import tailwind from '@/../tailwind.config';
import { Roboto } from 'next/font/google';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import config from '@/config/config';

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
  children,
}: Readonly<{
  children: ReactNode;
  params: any;
}>) {
  const [clientCached, setClientCached] = useState<
  ApolloClient<NormalizedCacheObject> | null>(null);

  const path = usePathname();

  useEffect(() => {
    (async () => {
      const _config = await config();
      console.log(_config);
      window.config = _config;
      setClientCached(client(_config.server));
    })()
  }, []);

  if (clientCached === null) {
    return null;
  }

  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ApolloProvider client={clientCached}>
          <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
              <SnackbarProvider maxSnack={3}>
                <div className="size-full flex flex-col text-base">
                  {!(path.startsWith('/admin') || path.startsWith('/auth'))
                    && (
                    <div className="rounded-none z-10 shadow-lg">
                      <div className="mx-auto px-6 h-16 flex justify-between items-center">
                        <Link href="/" className="text-cms-gray-dark font-bold text-xl">
                          MMCMS
                        </Link>
                      </div>
                    </div>
                    )}
                  <main className="flex-1 ">{children}</main>
                </div>
              </SnackbarProvider>
            </ThemeProvider>
          </StyledEngineProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}
