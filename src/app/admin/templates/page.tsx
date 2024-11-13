'use client';

import React, { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  Card,
  CardHeader,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import dayjs from 'dayjs';
import TemplateEdit from '@/components/TemplateEdit';

const GET_TEMPLATES_AND_TABLES = gql`
  query {
    getTemplates {
      id
      title
      html
      createdAt
      updatedAt
    }
    getTables {
      id
      name
    }
  }
`;

type Template = {
  id: string,
  title: string,
  html: string,
  createdAt: string
  updatedAt: string
};

type TemplateCardProps = {
  template: Template;
  onEdit: (template: any) => void;
  onDelete: (id: string) => void;
};

function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
  return (
    <Card>
      <CardHeader
        title={template.title}
        subheader={(
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">
              Код:
              {template.name}
            </span>
            <span className="text-sm text-gray-500">
              Создано:
              {' '}
              {dayjs(parseInt(template.createdAt, 10)).format('DD.MM.YYYY')}
            </span>
          </div>
        )}
        action={(
          <div className="flex gap-2">
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
    </Card>
  );
}

function TemplatesPage() {
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data, loading, refetch } = useQuery(GET_TEMPLATES_AND_TABLES);

  const handleCloseTemplate = () => {
    setIsTemplateOpen(false);
    setSelectedTemplate(null);
    refetch();
  };

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить этот шаблонв?')) {
      // no action required
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <Typography variant="h4">Шаблоны</Typography>
        <Button variant="contained" onClick={() => setIsTemplateOpen(true)}>
          Добавить шаблон
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.getAllTemplates?.map(
          (template: Template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={(editedtemplate: React.SetStateAction<null>) => {
                setSelectedTemplate(editedtemplate);
                setIsTemplateOpen(true);
              }}
              onDelete={handleDelete}
            />
          ),
        )}
      </div>

      <Dialog
        open={isTemplateOpen}
        onClose={handleCloseTemplate}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          {selectedTemplate ? 'Редактировать форму' : 'Создать форму'}
        </DialogTitle>
        <DialogContent>
          <TemplateEdit
            id={selectedTemplate?.id}
            onClose={handleCloseTemplate}
            // tables={data?.getTables || []}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TemplatesPage;
