'use client';

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
import {
  ReactNode, useEffect, useState, MouseEvent,
} from 'react';
import Link from 'next/link';
import config from '@/config/config';

import { usePathname, useRouter } from 'next/navigation';
import { KeyboardArrowDownRounded, NotificationsNoneOutlined } from '@mui/icons-material';

const inter = Roboto({
  weight: ['100', '300', '400', '500', '700', '900'],
  variable: '--font-roboto',
  subsets: ['cyrillic-ext', 'latin'],
});

interface User {
  id: string;
  name: string;
  role: string;
}

interface MeQueryResponse {
  me: User;
}

const GET_ME = gql`
  query GetMe {
    me {
      id
      name
      role
    }
  }
`;

const GET_ALL_SITE_ITEMS = gql`
  query GetMe {
    getAllSiteItems {
      title
      url
    }
  }
`;

const getInitials = (name: string) => name
  .split(' ')
  .slice(0, 2)
  .map((word) => word[0])
  .join('')
  .toUpperCase();

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

function Header() {
  const path = usePathname();

  const router = useRouter();
  const [userPopoverEl, setUserPopoverEl] = useState<null | HTMLElement>(null);
  const userPopoverOpen = Boolean(userPopoverEl);

  const handleUserPopoverClick = (event: MouseEvent<HTMLElement>) => {
    setUserPopoverEl(event.currentTarget);
  };
  const handleUserPopoverClose = () => {
    setUserPopoverEl(null);
  };

  const {
    data, refetch, error, loading,
  } = useQuery(GET_ME);

  const getAllSiteItems = useQuery(GET_ALL_SITE_ITEMS);

  if (loading) {
    return null;
  }

  return !(path.startsWith('/admin') || path.startsWith('/auth'))
    && (
      <>
        <div className="rounded-none z-10 shadow-lg">
          <div className="mx-auto px-6 h-16 flex justify-between items-center">
            <Link href="/" className="text-cms-gray-dark font-bold text-xl">
              MMCMS
            </Link>
            <div>
              {getAllSiteItems.data?.getAllSiteItems.map((item) => (
                <Link key={item.url} href={item.url}>
                  <span className="mx-3">{item.title}</span>
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {data?.me ? (
                <>
                  <IconButton size="large" className="text-gray-600">
                    <Badge color="primary" variant="dot">
                      <NotificationsNoneOutlined />
                    </Badge>
                  </IconButton>

                  <Divider
                    className="border-spacing-1.5 border-cms-gray-dark h-4 my-auto"
                    orientation="vertical"
                    variant="middle"
                    flexItem
                  />
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8 text-sm">
                      {getInitials(data.me.name)}
                    </Avatar>
                    <Button
                      variant="text"
                      className="normal-case text-cms-gray-dark !text-base"
                      onClick={handleUserPopoverClick}
                      endIcon={<KeyboardArrowDownRounded />}
                    >
                      {data.me.name}
                    </Button>
                    <Menu
                      id="user-menu"
                      anchorEl={userPopoverEl}
                      open={userPopoverOpen}
                      onClose={handleUserPopoverClose}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                    >
                      <MenuItem onClick={() => router.push('/admin')}>
                        Админпанель
                      </MenuItem>
                      {/* <MenuItem onClick={handleLogout}>Выйти</MenuItem> */}
                    </Menu>
                  </div>
                </>
              ) : (
                <Button
                  className="normal-case"
                  href="/auth/login"
                  variant="contained"
                  color="primary"
                >
                  Войти
                </Button>
              )}
            </div>
          </div>
        </div>
        <div />

      </>
    );
}

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
    })();
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
                  <Header />
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
