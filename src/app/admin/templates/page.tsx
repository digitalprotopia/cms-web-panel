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
} from '@mui/material';
import {
  Edit, AccessTime, Delete,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import DefaultEditor from 'react-simple-wysiwyg';
import { ITemplate } from '@/components/entities/ITemplate';
import { IWidget } from '@/components/entities/IWidget';
import { IForm } from '@/components/entities/IForm';

const GET_TEMPLATES = gql`
  query GetTemplates {
    getTemplates {
      id
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
      title
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
  title: string;
  url: string;
  parentId?: string;
  isRoot?: boolean;
  seotag?: string;
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
  const [formData, setFormData] = useState<TemplateFormData>({
    id: initialData.id || '',
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

      <h4>Контент</h4>
      <DefaultEditor
        value={formData.html}
        onChange={(e) => setFormData({ ...formData, html: e.target.value })}
      />

      <h4>Добавить виджеты</h4>
      <div>
        {snippets.data?.getAllWidgets?.map((widget: IWidget) => (
          <MenuItem key={widget.id} onClick={() => setFormData({ ...formData, html: `${formData.html}[widget:${widget.name}]` })}>
            {widget.title}
          </MenuItem>
        ))}
      </div>
      <h4>Добавить формы</h4>
      <div>
        {snippets.data?.getAllForms?.map((form: IForm) => (
          <MenuItem key={form.id} onClick={() => setFormData({ ...formData, html: `${formData.html}[form:${form.name}]` })}>
            {form.title}
          </MenuItem>
        ))}
      </div>
      <h4>Добавить шаблоны</h4>
      <div>
        {useQuery(GET_TEMPLATES).data?.getTemplates?.map((form: IForm) => (
          <MenuItem
            key={form.id}
            onClick={() => setFormData({ ...formData, html: `${formData.html}[form:${form.name}]` })}
          >
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
      console.error('Ошибка при создании страницы:', error);
    },
  });

  const [updateTemplate] = useMutation(UPDATE_TEMPLATE, {
    onCompleted: () => {
      setIsFormOpen(false);
      setSelectedTemplate(null);
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при обновлении страницы:', error);
    },
  });

  const [deleteTemplate] = useMutation(DELETE_TEMPLATE, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при удалении страницы:', error);
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
    if (window.confirm('Вы уверены, что хотите удалить эту страницу?')) {
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
        <Typography variant="h4">Страницы</Typography>
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
          {selectedTemplate ? 'Редактировать страницу' : 'Создать новую страницу'}
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
