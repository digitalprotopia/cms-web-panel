import UserContext from '@/components/UserContext';
import { KeyboardArrowDownRounded, NotificationsNoneOutlined } from '@mui/icons-material';
import {
  Avatar, Badge, Button, Divider, IconButton, Menu, MenuItem,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  MouseEventHandler, ReactNode, useContext, useState,
} from 'react';

const getInitials = (name: string) => name
  .split(' ')
  .slice(0, 2)
  .map((word) => word[0])
  .join('')
  .toUpperCase();

function Header() {
  const router = useRouter();

  const [userPopoverEl, setUserPopoverEl] = useState<null | HTMLElement>(null);
  const userPopoverOpen = Boolean(userPopoverEl);

  const handleUserPopoverClick: MouseEventHandler<HTMLElement> = (event) => {
    setUserPopoverEl(event.currentTarget);
  };
  const handleUserPopoverClose = () => {
    setUserPopoverEl(null);
  };

  const user = useContext(UserContext);

  const handleLogout = async () => {
    handleUserPopoverClose();
    user.logout();
  };

  if (!user.user) {
    return null;
  }

  return (
    <>
      <div className="rounded-none z-10 shadow-lg">
        <div className="mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="text-cms-gray-dark font-bold text-xl">
            MMCMS
          </Link>
          <div className="flex items-center gap-3">
            {user.user ? (
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
                    {getInitials(user.user.name)}
                  </Avatar>
                  <Button
                    variant="text"
                    className="normal-case text-cms-gray-dark !text-base"
                    onClick={handleUserPopoverClick}
                    endIcon={<KeyboardArrowDownRounded />}
                  >
                    {user.user.name}
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
                    {user.user.role.name === 'admin' && (
                      <MenuItem
                        onClick={() => router.push('/admin')}
                      >
                        Админпанель
                      </MenuItem>
                    )}
                    <MenuItem onClick={handleLogout}>Выйти</MenuItem>
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

export default function IndexLayout(props: {
  children: ReactNode
}) {
  return (
    <main className="flex-1 ">
      <Header />
      {props.children}
    </main>
  );
}
