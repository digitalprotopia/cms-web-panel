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
} from '@mui/material';
import {
  Edit, AccessTime, Delete,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { ISite, SiteFormData } from '@/components/entities/ISite';
import textField from '@/components/gui/TextField';
import { ITemplateGroup } from '@/components/entities/ITemplateGroup';
import S3Autocomplete from '@/components/gui/S3Autocomplete';
import { GET_TEMPLATE_GROUPS } from '../templateGroups/page';

const GET_SITES = gql`
  query getAllSites {
    getAllSites {
      id
      name
      title
      favicon
      url
      templateGroupId
      platformId
      createdAt
      updatedAt
    }
  }
`;

const CREATE_SITE = gql`
  mutation CreateSite($input: SiteInput!) {
    createSite(input: $input) {
      id
      favicon
      url
      templateGroupId
      platformId
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_SITE = gql`
  mutation UpdateSite($id: ID!, $input: SiteInput!) {
    editSite(id: $id, input: $input) {
      id
      name
      title
      favicon
      url
      templateGroupId
      platformId
      createdAt
      updatedAt
    }
  }
`;

const DELETE_SITE = gql`
  mutation DeleteSite($id: ID!) {
    deleteSite(id: $id)
  }
`;

function SiteForm({
  initialData = {},
  onSubmit,
  onCancel,
}: {
  initialData: Partial<SiteFormData>;
  onSubmit: (data: SiteFormData) => void;
  onCancel: () => void;
}) {
  const {
    id = '', name = '', title = '', templateGroupId = null, favicon = '', url = '', platformId = undefined,
  } = initialData;
  const [formData, setFormData] = useState<SiteFormData>({
    id, name, title, favicon, url, templateGroupId, platformId,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  const templateGroups: ITemplateGroup[] = useQuery(GET_TEMPLATE_GROUPS).data?.getTemplateGroups;

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="grid grid-cols-2 gap-4">
        {textField('Название', formData.name, (e) => setFormData({ ...formData, name: e.target.value }))}
        {textField('Заголовок', formData.title, (e) => setFormData({ ...formData, title: e.target.value }))}
        {textField('URL', formData.url, (e) => setFormData({ ...formData, url: e.target.value }))}
        <S3Autocomplete
          value={formData.templateGroupId}
          options={templateGroups}
          onChange={(e) => setFormData({
            ...formData,
            templateGroupId: typeof e === 'string' || e === null ? e : e[0],
          })}
        />
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

function SiteCard({
  site,
  onEdit,
  onDelete,
}: {
  site: ISite;
  onEdit: (site: ISite) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader
        title={site.title}
        action={(
          <div>
            <IconButton onClick={() => onEdit(site)} size="small">
              <Edit />
            </IconButton>
            <IconButton
              onClick={() => onDelete(site.id)}
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
          {/* {site.url} */}
        </Typography>
        <div className="flex items-center">
          <AccessTime sx={{ fontSize: 16, marginRight: '4px' }} />
          <Typography variant="caption" color="text.secondary">
            {dayjs(parseInt(String(site.createdAt), 10)).toString()}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}

function SitesPage() {
  const [selectedSite, setSelectedSite] = useState<ISite | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, loading, refetch } = useQuery(GET_SITES);

  const [createSite] = useMutation(CREATE_SITE, {
    onCompleted: () => {
      setIsFormOpen(false);
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при создании сайта:', error);
    },
  });

  const [updateSite] = useMutation(UPDATE_SITE, {
    onCompleted: () => {
      setIsFormOpen(false);
      setSelectedSite(null);
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при обновлении сайта:', error);
    },
  });

  const [deleteSite] = useMutation(DELETE_SITE, {

    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при удалении сайта:', error);
    },
  });

  const handleCreate = (formData: SiteFormData) => {
    const { id, ...inputData } = formData;
    createSite({ variables: { input: inputData } });
  };

  const handleUpdate = (formData: SiteFormData) => {
    if (!selectedSite) return;
    const { id, ...inputData } = formData;
    updateSite({
      variables: {
        id: selectedSite.id,
        input: inputData,
      },
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот сайт?')) {
      deleteSite({ variables: { id } });
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
      <div className="flex items-center justify-between gap-4">
        <Typography variant="h4">Сайты</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setSelectedSite(null);
            setIsFormOpen(true);
          }}
        >
          Добавить сайт
        </Button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 p-4">
        {data?.getAllSites?.map((site: ISite) => (
          <SiteCard
            key={site.id}
            site={site}
            onEdit={(editedSite) => {
              setSelectedSite(editedSite);
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
          setSelectedSite(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedSite ? 'Редактировать сайт' : 'Создать новый сайт'}
        </DialogTitle>
        <DialogContent>
          <SiteForm
            initialData={selectedSite || {}}
            onSubmit={selectedSite ? handleUpdate : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedSite(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SitesPage;
