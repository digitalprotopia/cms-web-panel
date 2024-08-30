import App from 'next/app';
import {
  ApolloProvider, gql, useMutation, useQuery,
} from '@apollo/client';
import {
  createTheme, Menu, MenuItem, ThemeProvider,
} from '@mui/material';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { AccountCircleOutlined, KeyboardArrowDownRounded } from '@mui/icons-material';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import clsx from 'clsx';
import client from '../components/apollo-client';
import { theme as tailwind } from '../tailwind.config';
import '../globals.css';

function DropdownIcon(props) {
  return (
    <Box
      {...props}
      component="span"
      sx={{
        px: 0.5,
        stroke: '#859CBE',
        display: 'flex',
        alignItems: 'center',
      }}
    />
  );
}
const theme = createTheme({
  palette: {
    primary: {
      main: tailwind.extend.colors.primary,
      contrastText: '#ffffff',
    },
    secondary: {
      main: tailwind.extend.colors.secondary,
      contrastText: '#4B5A73',
    },
    tertiary: {
      main: tailwind.extend.colors.tertiary,
      contrastText: '#4B5A73',
    },
  },
  variables: {
    leftPanel: {
      width: 250,
    },
    header: {
      height: 73,
    },
  },
  components: {
    MuiSelect: {
      defaultProps: {
        IconComponent: DropdownIcon,
      },
    },
  },
});

const GET_ME = gql`
query {
  me {
    id
    name
    role
    licenses {
        activated
    }
    cart {
      id
    }
    orders {
      id
      isPaid
    }
  }
}
`;

const LOG_OUT = gql`
mutation {
  logOut
}
`;

function S3App({ Component, pageProps }) {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  try {
    window.enqueueSnackbar = enqueueSnackbar;
    window.router = router;
  } catch (e) {
    //
  }

  const [logOut] = useMutation(LOG_OUT);

  const [userPopoverEl, setUserPopoverEl] = useState(null);
  const userPopoverOpen = Boolean(userPopoverEl);

  const handleUserPopoverClick = (event) => {
    setUserPopoverEl(event.currentTarget);
  };
  const handleUserPopoverClose = () => {
    setUserPopoverEl(null);
  };

  const getMe = useQuery(GET_ME);
  let {
    data,
  } = getMe;
  const {
    refetch,
    error,
    loading,
  } = getMe;
  if (!loading && (error || !data?.me)) {
    localStorage.removeItem('token');
    data = null;
  }

  const allowedPathsGuest = ['/', '/login', '/register', '/restore-password/request', '/restore-password/confirm', '/confirm-email'];
  const disallowedPathsUser = ['/login', '/register', '/restore-password/request', '/restore-password/confirm'];

  if (loading) {
    return null;
  }

  if (
    !loading
      && !data?.me
      && !allowedPathsGuest.some((path) => router.pathname.includes(path))
  ) {
    router.push('/login');
    return null;
  }

  if (
    !loading
      && data
      && disallowedPathsUser.some((path) => router.pathname.includes(path))
  ) {
    router.push('/');
    return null;
  }

  return (
    <div className="flex flex-col bg-[#e9e9e9] h-full" id="app">
      <Head>
        <meta name="viewport" content="width=1200" />
        <title>Маркетплейс Цифровой Протопии</title>
        <link rel="icon" href="/favicon.png" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
        />
      </Head>
      <header className="bg-white flex shadow-lg justify-between p-4">
        <Link href="/" passHref>
          <div className="flex items-center cursor-pointer">
            <Image src="/Logo.svg" alt="" width={208} height={55} />
            <span className="text-black/60 font-medium text-xl ml-2">| MARKETPLACE</span>
          </div>
        </Link>

        <div className="flex items-center">
          {data?.me ? (
            <div className="flex gap-4">
              <div className="flex items-center gap-3 font-light text-base text-black/60">
                <Link href="/cart" className={clsx({ 'font-bold': router.pathname.includes('/cart') })} passHref>
                  Корзина (
                  {data?.me.cart.length}
                  )
                </Link>
                <Link href="/orders" className={clsx({ 'font-bold': router.pathname.includes('/orders') })} passHref>
                  Заказы (
                  {data?.me.orders.filter((order) => !order.isPaid).length}
                  )
                </Link>
                <Link href="/licenses" className={clsx({ 'font-bold': router.pathname.includes('/licenses') })} passHref>
                  Ключи (
                  {data?.me.licenses.length}
                  )
                </Link>
              </div>
              <Button
                variant="contained"
                color="inherit"
                aria-controls={userPopoverOpen ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={userPopoverOpen ? 'true' : undefined}
                onClick={handleUserPopoverClick}
              >
                <AccountCircleOutlined />
                <span className="mx-2.5">{data?.me.name}</span>
                <KeyboardArrowDownRounded />
              </Button>
              <Menu
                id="basic-menu"
                anchorEl={userPopoverEl}
                open={userPopoverOpen}
                onClose={handleUserPopoverClose}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
              >
                <MenuItem onClick={async () => {
                  await router.push('/account');
                }}
                >
                  Мой аккаунт
                </MenuItem>
                <MenuItem onClick={async () => {
                  await logOut();
                  handleUserPopoverClose();
                  localStorage.removeItem('token');
                  try {
                    await refetch();
                  } catch (e) {
                    console.log(e);
                  }
                  await router.push('/login');
                }}
                >
                  Выйти
                </MenuItem>
              </Menu>
            </div>
          ) : (
            <Button className="normal-case bg-primary/20 text-primary text-xl" href="/login" size="large" variant="contained">
              Войти
            </Button>
          )}
        </div>
      </header>
      <main className="p-7 grow overflow-auto">
        <Component
          {...pageProps}
          user={data?.me}
          refetchUser={refetch}
        />
      </main>
      {/* TODO: Вставить ссылки на различные документы */}
      <footer className="flex justify-between items-center p-5 bg-[#e1e1e1] h-20 font-light text-base text-black/60">
        <div className="flex gap-4">
          <Link href="https://digitalprotopia.ru">О компании</Link>
          <Link href="https://s3app.ru/privacy">Политика конфиденциальности</Link>
          <Link href="https://s3app.ru/oferta">Договор публичной оферты</Link>
        </div>
        <div>
          <span>© Цифровая Протопия, 2024</span>
        </div>
      </footer>
    </div>
  );
}

export default function S3AppContainer(props) {
  return (
  // <StyledEngineProvider injectFirst>
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <SnackbarProvider maxSnack={3}>
          <S3App {...props} />
        </SnackbarProvider>
      </ThemeProvider>
    </ApolloProvider>
  // </StyledEngineProvider>
  );
}

S3AppContainer.getInitialProps = async (appContext) => {
  const appProps = await App.getInitialProps(appContext);
  return { ...appProps };
};
