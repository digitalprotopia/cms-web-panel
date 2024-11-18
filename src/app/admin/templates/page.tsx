'use client';

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
} from '@mui/material';
import {
  Edit, AccessTime, Delete,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { ITemplate, TemplateFormData } from '@/components/entities/ITemplate';
import TemplateEdit from '@/components/TemplateEdit';

const GET_TEMPLATES = gql`
  query GetTemplates {
    getTemplates {
      id
      name
      title
      html
      templateGroupId
      createdAt
      updatedAt
    }
  }
`;

const CREATE_TEMPLATE = gql`
  mutation CreateTemplate($input: TemplateInput!) {
    createTemplate(input: $input) {
      id
      html
    }
  }
`;

const UPDATE_TEMPLATE = gql`
  mutation UpdateTemplate($id: ID!, $input: TemplateInput!) {
    editTemplate(id: $id, input: $input) {
      name
      title
      templateGroupId
      html
      createdAt
      updatedAt
    }
  }
`;

const DELETE_TEMPLATE = gql`
  mutation DeleteTemplate($id: ID!) {
    deleteTemplate(id: $id)
  }
`;

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: ITemplate;
  onEdit: (template: ITemplate) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader
        title={template.title}
        action={(
          <div>
            <IconButton onClick={() => onEdit(template)} size="small">
              <Edit />
            </IconButton>
            <IconButton
              onClick={() => onDelete(template.id)}
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
          {/* {template.url} */}
        </Typography>
        <div className="flex items-center">
          <AccessTime sx={{ fontSize: 16, marginRight: '4px' }} />
          <Typography variant="caption" color="text.secondary">
            {dayjs(parseInt(String(template.createdAt), 10)).toString()}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<ITemplate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, loading, refetch } = useQuery(GET_TEMPLATES);

  const [createTemplate] = useMutation(CREATE_TEMPLATE, {
    onCompleted: () => {
      setIsFormOpen(false);
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при создании шаблона:', error);
    },
  });

  const [updateTemplate] = useMutation(UPDATE_TEMPLATE, {
    onCompleted: () => {
      setIsFormOpen(false);
      setSelectedTemplate(null);
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при обновлении шаблона:', error);
    },
  });

  const [deleteTemplate] = useMutation(DELETE_TEMPLATE, {

    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при удалении шаблона:', error);
    },
  });

  const handleCreate = (formData: TemplateFormData) => {
    createTemplate({ variables: { input: formData } });
  };

  const handleUpdate = (formData: TemplateFormData) => {
    if (!selectedTemplate) return;
    updateTemplate({
      variables: {
        id: selectedTemplate.id,
        input: formData,
      },
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      deleteTemplate({ variables: { id } });
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
        <Typography variant="h4">Шаблоны</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setSelectedTemplate(null);
            setIsFormOpen(true);
          }}
        >
          Добавить шаблон
        </Button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 p-4">
        {data?.getTemplates?.map((template: ITemplate) => (
          <TemplateCard
            key={template.id}
            template={template}
            onEdit={(editedTemplate) => {
              setSelectedTemplate(editedTemplate);
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
          setSelectedTemplate(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTemplate ? 'Редактировать шаблон' : 'Создать новый шаблон'}
        </DialogTitle>
        <DialogContent>
          <TemplateEdit
            initialData={selectedTemplate || {}}
            onSubmit={selectedTemplate ? handleUpdate : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedTemplate(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TemplatesPage;
