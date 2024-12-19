import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
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
import { ISiteItem } from '@/components/entities/ISiteItem';

import PageEditForm, { GET_PAGES } from '@/components/forms/PageEditForm';
import { makeTree, TreeItem } from '@/components/guiElements/Tree';

const CREATE_PAGE = gql`
  mutation CreateSiteItem($input: SiteItemInput!) {
    createSiteItem(input: $input) {
      id
      name
      title
      url
      parentId
      isRoot
      seotag
      html
      type
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_PAGE = gql`
  mutation UpdateSiteItem($id: ID!, $input: SiteItemInput!) {
    editSiteItem(id: $id, input: $input) {
      id
      name
      title
      url
      parentId
      isRoot
      seotag
      html
      type
      createdAt
      updatedAt
    }
  }
`;

const DELETE_PAGE = gql`
  mutation DeleteSiteItem($id: ID!) {
    deleteSiteItem(id: $id)
  }
`;

function PageCard({
  page,
  onEdit,
  onDelete,
}: {
  page: ISiteItem;
  onEdit: (page: ISiteItem) => void;
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
        subheader={page.url}
        action={(
          <div>
            <IconButton onClick={() => onEdit(page)} size="small">
              <Edit />
            </IconButton>
            <Link href={`/${page.url}`}>
              <IconButton size="small">
                <Visibility />
              </IconButton>
            </Link>
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
  const [selectedPage, setSelectedPage] = useState<ISiteItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, loading, refetch } = useQuery(GET_PAGES);

  const [createPage] = useMutation(CREATE_PAGE, {
    onCompleted: () => {
      setIsFormOpen(false);
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при создании страницы:', error);
    },
  });

  const [updatePage] = useMutation(UPDATE_PAGE, {
    onCompleted: () => {
      setIsFormOpen(false);
      setSelectedPage(null);
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при обновлении страницы:', error);
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

  const handleCreate = (formData: Partial<ISiteItem>) => {
    createPage({ variables: { input: formData } });
  };

  const handleUpdate = (formData: Partial<ISiteItem>) => {
    if (!selectedPage) return;
    updatePage({
      variables: {
        id: selectedPage.id,
        input: formData,
      },
    });
  };

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
        <Button
          variant="contained"
          onClick={() => {
            setSelectedPage(null);
            setIsFormOpen(true);
          }}
        >
          Добавить страницу
        </Button>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <div className="flex-grow grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 p-4">
          {data?.getAllSiteItems?.map((page: ISiteItem) => (
            <PageCard
              key={page.id}
              page={page}
              onEdit={(_page) => {
                setSelectedPage({
                  ..._page,
                  roleIds: _page.roles!.map((role) => role.id),
                });
                setIsFormOpen(true);
              }}
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

      <Dialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedPage(null);
        }}
        maxWidth="md"
        fullScreen
      >
        <DialogTitle>
          {selectedPage ? 'Редактировать страницу' : 'Создать новую страницу'}
        </DialogTitle>
        <DialogContent>
          <PageEditForm
            initialData={selectedPage || {}}
            onSubmit={selectedPage ? handleUpdate : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedPage(null);
            }}
            roles={data.getRoles}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PagesPage;
