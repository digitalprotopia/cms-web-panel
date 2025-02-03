import React, { useMemo } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  List,
} from '@mui/material';
import {
  Edit, AccessTime, Delete, Visibility,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import Link from 'next/link';
import { ISiteItem, SiteItemType } from '@/components/entities/ISiteItem';

import { GET_SITE_PAGES } from '@/components/forms/PageEditForm';
import { makeTree, TreeItem } from '@/components/guiElements/Tree';
import { getSiteItemUrl } from '@/components/use-table';
import { useRouter } from 'next/router';
import { MaterialReactTable, MRT_ColumnDef } from 'material-react-table';

const DELETE_PAGE = gql`
  mutation DeleteSiteItem($id: ID!) {
    deleteSiteItem(id: $id)
  }
`;

function PageCard({
  page,
  pages,
  onDelete,
}: {
  page: ISiteItem;
  pages: ISiteItem[];
  onDelete: (id: string) => void;
}) {
  const router = useRouter();

  // const formatDate = (dateString: string) => new Date(dateString).toLocaleString('ru-RU', {
  //   day: 'numeric',
  //   month: 'long',
  //   year: 'numeric',
  //   hour: '2-digit',
  //   minute: '2-digit',
  // });

  return (
    <Card>
      <CardHeader
        title={page.title}
        subheader={getSiteItemUrl(page, pages)
          + (page.type === SiteItemType.DYNAMIC ? ' (динамическая)' : '')}
        action={(
          <div>
            <Link href={`/admin/sites/${router.query['site-id']}/pages/${page.id}`}>
              <IconButton size="small">
                <Edit />
              </IconButton>
            </Link>
            {page.type === SiteItemType.DYNAMIC ? null : (
              <Link href={getSiteItemUrl(page, pages)}>
                <IconButton size="small">
                  <Visibility />
                </IconButton>
              </Link>
            )}
            <IconButton
              onClick={() => onDelete(page.id)}
              size="small"
              color="error"
            >
              <Delete />
            </IconButton>
          </div>
        )}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {/* {page.url} */}
        </Typography>
        <div className="flex items-center">
          <AccessTime sx={{ fontSize: 16, marginRight: '4px' }} />
          <Typography variant="caption" color="text.secondary">
            {dayjs(page.createdAt).toString()}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}

function PagesPage() {
  const router = useRouter();

  const { data, loading, refetch } = useQuery(GET_SITE_PAGES, {
    variables: {
      id: router.query['site-id'],
    },
  });

  const [deletePage] = useMutation(DELETE_PAGE, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при удалении страницы:', error);
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту страницу?')) {
      deletePage({ variables: { id } });
    }
  };

  const columns: MRT_ColumnDef<any, any>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Название',
        size: 200,
      },
      {
        accessorKey: 'url',
        header: 'URL',
        size: 400,
        Cell: ({ row }: { row: any }) => (
          row.original.url + (row.original.type === SiteItemType.DYNAMIC ? ' (динамическая)' : '')
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Дата создания',
        size: 150,
        Cell: ({ row }: { row: any }) => (
          dayjs(row.original.createdAt).format('DD.MM.YYYY HH:mm')
        ),
      },
      {
        accessorKey: 'actions',
        header: 'Действия',
        size: 200,
        Cell: ({ row }: { row: any }) => (
          <div>
            <Link href={`/admin/sites/${router.query['site-id']}/pages/${row.original.id}`}>
              <IconButton size="small">
                <Edit />
              </IconButton>
            </Link>
            {row.original.type === SiteItemType.DYNAMIC ? null : (
              <Link href={getSiteItemUrl(row.original, data?.getSite?.siteItems || [])}>
                <IconButton size="small">
                  <Visibility />
                </IconButton>
              </Link>
            )}
            <IconButton
              onClick={() => handleDelete(row.original.id)}
              size="small"
              color="error"
            >
              <Delete />
            </IconButton>
          </div>
        ),
      },
    ],
    [router],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  const items: ISiteItem[] = data?.getSite?.siteItems || [];
  const tree = makeTree(items);

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <div className="flex items-center gap-4">
        <Link href={`/admin/sites/${router.query['site-id']}/pages/add`}>
          <Button
            variant="contained"
          >
            Добавить страницу
          </Button>
        </Link>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <MaterialReactTable
          columns={columns}
          data={(data?.getSite?.siteItems || []).map((page: ISiteItem) => ({
            ...page,
            url: getSiteItemUrl(page, data?.getSite?.siteItems || []),
          }))}
          enableColumnResizing
          enableFullScreenToggle={false}
          enableDensityToggle
          enableColumnFilters
          enablePagination
          enableSorting
          initialState={{
            sorting: [{
              id: 'url',
              desc: false,
            }],
          }}
          muiTableProps={{
            sx: {
              tableLayout: 'fixed',
            },
          }}
          renderTopToolbarCustomActions={() => (
            <div className="px-4 py-2">
              <h1 className="text-xl font-bold">
                Страницы сайта
                {' '}
                {data?.getSite?.title}
              </h1>
            </div>
          )}
        />
        <div className="md:w-64 shrink-0">
          <List className="sticky top-4">
            {tree.map((page) => (
              <TreeItem key={page.id} item={page} />
            ))}
          </List>
        </div>
      </div>
    </div>
  );
}

export default PagesPage;
