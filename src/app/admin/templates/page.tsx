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
  Autocomplete,
} from '@mui/material';
import {
  Edit, AccessTime, Delete,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import DefaultEditor from 'react-simple-wysiwyg';
import { ITemplate } from '@/components/entities/ITemplate';

const GET_TEMPLATES = gql`
  query GetTemplates {
    getTemplates {
      id
      name
      title
      html
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
      id
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

interface TemplateFormData {
  id?: string;
  name?: string;
  title: string;
  templateGroupId?: string;
  html?: string;
}

function TemplateForm({
  initialData = {},
  onSubmit,
  onCancel,
}: {
  initialData: Partial<TemplateFormData>;
  onSubmit: (data: TemplateFormData) => void;
  onCancel: () => void;
}) {
  const {
    id = '', name = '', title = '', templateGroupId, html = '',
  } = initialData;
  const [formData, setFormData] = useState<TemplateFormData>({
    id, name, title, templateGroupId, html,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Название"
          fullWidth
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <TextField
          label="Заголовок"
          fullWidth
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        <Autocomplete
          fullWidth
          options={[]}
          value={formData.templateGroupId}
          renderInput={(params) => <TextField {...params} label="Группа шаблонов" />}
        />
      </div>

      <h4>HTML</h4>
      <DefaultEditor
        value={formData.html}
        onChange={(e) => setFormData({ ...formData, html: e.target.value })}
      />

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

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: ITemplate;
  onEdit: (template: ITemplate) => void;
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
    const { id, ...inputData } = formData;
    createTemplate({ variables: { input: inputData } });
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
          <TemplateForm
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
