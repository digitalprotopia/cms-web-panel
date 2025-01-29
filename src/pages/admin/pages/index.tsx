import React from 'react';
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

import { GET_PAGES } from '@/components/forms/PageEditForm';
import { makeTree, TreeItem } from '@/components/guiElements/Tree';
import { getSiteItemUrl } from '@/components/use-table';

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
            <Link href={`/admin/pages/${page.id}`}>
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
  const { data, loading, refetch } = useQuery(GET_PAGES);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  const items: ISiteItem[] = data?.getAllSiteItems || [];
  const tree = makeTree(items);

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <div className="flex items-center gap-4">
        <Typography variant="h4">Страницы</Typography>
        <Link href="/admin/pages/add">
          <Button
            variant="contained"
          >
            Добавить страницу
          </Button>
        </Link>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <div className="flex-grow grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 p-4">
          {data?.getAllSiteItems?.map((page: ISiteItem) => (
            <PageCard
              key={page.id}
              page={page}
              pages={data.getAllSiteItems}
              onDelete={handleDelete}
            />
          ))}
        </div>

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
