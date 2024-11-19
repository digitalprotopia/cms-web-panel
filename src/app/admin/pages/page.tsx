'use client';

import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  CircularProgress,
  MenuItem,
  FormControl,
  FormControlLabel,
} from '@mui/material';
import {
  Edit, AccessTime, Delete, Visibility,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import Link from 'next/link';
import DefaultEditor, { Editor, EditorProvider } from 'react-simple-wysiwyg';
import { ISiteItem } from '@/components/entities/ISiteItem';

const GET_PAGES = gql`
  query GetAllSiteItems {
    getAllSiteItems {
      id
      name
      title
      url
      parentId
      isRoot
      seotag
      html
      createdAt
      updatedAt
    }
  }
`;

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

interface PageFormData {
  id?: string;
  name: string;
  title: string;
  url: string;
  parentId?: string;
  isRoot?: boolean;
  seotag?: string;
  html?: string;
}

function PageForm({
  initialData = {},
  onSubmit,
  onCancel,
}: {
  initialData: Partial<PageFormData>;
  onSubmit: (data: PageFormData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<PageFormData>({
    name: initialData.name || '',
    title: initialData.title || '',
    url: initialData.url || '',
    parentId: initialData.parentId,
    isRoot: initialData.isRoot || false,
    seotag: initialData.seotag || '',
    html: initialData.html || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const snippets = useQuery(gql`
    query {
      getAllWidgets {
        id
        name
        title
        createdAt
      }
      getAllForms {
        id
        name
        title
        createdAt
      }
  }`);

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="grid grid-cols-2 gap-4">
        {/* <TextField
          label="Название"
          fullWidth
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        /> */}
        <TextField
          label="Заголовок"
          fullWidth
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <TextField
        label="URL"
        fullWidth
        value={formData.url}
        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
        // required
        sx={{ mt: 2 }}
      />

      <TextField
        label="SEO Тег"
        fullWidth
        value={formData.seotag}
        onChange={(e) => setFormData({ ...formData, seotag: e.target.value })}
        sx={{ mt: 2 }}
      />
      <h4>Контент</h4>
      <DefaultEditor
        value={formData.html}
        onChange={(e) => setFormData({ ...formData, html: e.target.value })}
      />

      <h4>Добавить виджеты</h4>
      <div>
        {snippets.data?.getAllWidgets?.map((widget) => (
          <MenuItem key={widget.id} onClick={() => setFormData({ ...formData, html: `${formData.html}[widget:${widget.name}]` })}>
            {widget.title}
          </MenuItem>
        ))}
      </div>
      <h4>Добавить формы</h4>
      <div>
        {snippets.data?.getAllForms?.map((form) => (
          <MenuItem key={form.id} onClick={() => setFormData({ ...formData, html: `${formData.html}[form:${form.name}]` })}>
            {form.title}
          </MenuItem>
        ))}
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <Button variant="outlined" onClick={onCancel}>
          Отмена
        </Button>
        <Button variant="contained" type="submit">
          {initialData.id ? 'Обновить' : 'Создать'}
        </Button>
      </div>
    </form>
  );
}

function PageCard({
  page,
  onEdit,
  onDelete,
}: {
  page: ISiteItem;
  onEdit: (page: ISiteItem) => void;
  onDelete: (id: string) => void;
}) {
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
            {dayjs(parseInt(page.createdAt)).toString()}
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

  const handleCreate = (formData: PageFormData) => {
    createPage({ variables: { input: formData } });
  };

  const handleUpdate = (formData: PageFormData) => {
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

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 p-4">
        {data?.getAllSiteItems?.map((page: ISiteItem) => (
          <PageCard
            key={page.id}
            page={page}
            onEdit={(page) => {
              setSelectedPage(page);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <Dialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedPage(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedPage ? 'Редактировать страницу' : 'Создать новую страницу'}
        </DialogTitle>
        <DialogContent>
          <PageForm
            initialData={selectedPage || {}}
            onSubmit={selectedPage ? handleUpdate : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedPage(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PagesPage;
