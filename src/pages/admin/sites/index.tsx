import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Edit, AccessTime, Delete } from '@mui/icons-material';
import dayjs from 'dayjs';
import { ISite, SiteFormData } from '@/components/entities/ISite';
import SiteEditDialog from '@/components/dialogs/SiteEditDialog';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/router';

const GET_SITES = gql`
  query getAllSites {
    getAllSites {
      id
      title
      favicon
      domain
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
      domain
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
      title
      favicon
      domain
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

const ClickableTitle = styled(Typography)({
  cursor: 'pointer',
  '&:hover': {
    textDecoration: 'underline',
  },
});

function SiteCard({
  site,
  onEdit,
  onDelete,
}: {
  site: ISite;
  onEdit: (site: ISite) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();

  const handleTitleClick = () => {
    router.push(`/admin/sites/${site.id}`);
  };

  return (
    <Card>
      <CardHeader
        title={(
          <ClickableTitle variant="h6" onClick={handleTitleClick}>
            {site.title}
          </ClickableTitle>
        )}
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
          {site.domain}
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

      <SiteEditDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        selectedSite={selectedSite}
        onSubmit={selectedSite ? handleUpdate : handleCreate}
        onCancel={() => {
          setIsFormOpen(false);
          setSelectedSite(null);
        }}
      />
    </div>
  );
}

export default SitesPage;
