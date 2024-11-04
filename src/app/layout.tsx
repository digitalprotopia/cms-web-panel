'use client';

import './globals.css';
import client from '@/components/apollo-client';
import {
  createTheme,
  StyledEngineProvider,
  ThemeProvider,
} from '@mui/material';
import { ApolloProvider } from '@apollo/client';
import { SnackbarProvider } from 'notistack';
import tailwind from '@/../tailwind.config';
import { Roboto } from 'next/font/google';
import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const inter = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: '--font-roboto',
  subsets: ['cyrillic-ext', 'latin'],
});

const theme = createTheme({
  palette: {
    primary: {
      main: tailwind?.theme?.extend?.colors.cms?.primary,
      contrastText: '#ffffff',
    },
    secondary: {
      main: tailwind?.theme?.extend?.colors.cms?.secondary,
      contrastText: '#4B5A73',
    },
    tertiary: {
      main: tailwind?.theme?.extend?.colors.cms?.tertiary,
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
  const path = usePathname();
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ApolloProvider client={client}>
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
