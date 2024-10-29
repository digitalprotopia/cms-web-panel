"use client";

import { ReactNode, useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  IconButton,
  Badge,
  Paper,
  Avatar,
  Divider,
} from "@mui/material";
import Link from "next/link";
import { gql, useQuery } from "@apollo/client";
import Image from "next/image";
import {
  NotificationsNoneOutlined,
  KeyboardArrowDownRounded,
  AccountCircleOutlined,
  HouseOutlined,
  PeopleAltOutlined,
  CopyAllOutlined,
  ArticleOutlined,
  TableChartOutlined,
  DashboardOutlined,
  SmartToyOutlined,
  SvgIconComponent,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  role: string;
}

interface MeQueryResponse {
  me: User;
}

interface MenuItem {
  icon: SvgIconComponent;
  label: string;
  href: string;
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

const getInitials = (name: string) => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const menuItems: MenuItem[] = [
  {
    icon: HouseOutlined,
    label: "Главная",
    href: "/admin",
  },
  {
    icon: PeopleAltOutlined,
    label: "Аккаунты",
    href: "/admin/accounts",
  },
  {
    icon: CopyAllOutlined,
    label: "Страницы",
    href: "/admin/pages",
  },
  {
    icon: ArticleOutlined,
    label: "Записи",
    href: "/admin/posts",
  },
  {
    icon: TableChartOutlined,
    label: "Таблицы данных",
    href: "/admin/tables",
  },
  {
    icon: DashboardOutlined,
    label: "Формы и виджеты",
    href: "/admin/widgets",
  },
  {
    icon: SmartToyOutlined,
    label: "Боты",
    href: "/admin/bots",
  },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const router = useRouter();
  const [userPopoverEl, setUserPopoverEl] = useState<null | HTMLElement>(null);
  const userPopoverOpen = Boolean(userPopoverEl);

  const handleUserPopoverClick = (event: React.MouseEvent<HTMLElement>) => {
    setUserPopoverEl(event.currentTarget);
  };
  const handleUserPopoverClose = () => {
    setUserPopoverEl(null);
  };

  const { data, refetch, error, loading } = useQuery<MeQueryResponse>(GET_ME);

  if (!loading && (error || !data?.me)) {
    localStorage.removeItem("token");
  }

  const handleLogout = async () => {
    handleUserPopoverClose();
    localStorage.removeItem("token");
    try {
      await refetch();
      await router.push("/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="size-full flex flex-col text-base">
      <div className="rounded-none z-10 shadow-lg">
        <div className="mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="text-cms-gray-dark font-bold text-xl">
            MMCMS
          </Link>

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
                      vertical: "bottom",
                      horizontal: "right",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "right",
                    }}
                  >
                    <MenuItem onClick={() => router.push("/account")}>
                      Мой аккаунт
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>Выйти</MenuItem>
                  </Menu>
                </div>
              </>
            ) : (
              <Button
                className="normal-case"
                href="/login"
                variant="contained"
                color="primary"
              >
                Войти
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="bg-cms-gray-light flex-1 flex gap-4 p-4">
        <nav className="max-w-72 h-fit mx-auto flex-1 bg-white rounded p-4 shadow-lg">
          <ul className="flex flex-col gap-2">
            {menuItems.map((menuItem) => (
              <li className="bg-cms-gray-light rounded-md p-2">
                <Link
                  href={menuItem.href}
                  className="flex items-center text-gray-900"
                >
                  <menuItem.icon className="text-cms-gray-dark" />
                  <span className="ml-2 text-cms-gray-dark">
                    {menuItem.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex-1 ">{children}</main>
      </div>
    </div>
  );
}
