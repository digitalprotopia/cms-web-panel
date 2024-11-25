import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
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
import FormEdit from '@/components/FormEdit';

const GET_FORMS_AND_TABLES = gql`
  query {
    getAllForms {
      id
      name
      title
      createdAt
    }
    getTables {
      id
      name
    }
  }
`;

function FormCard({ form, onEdit, onDelete }) {
  return (
    <Card>
      <CardHeader
        title={form.title}
        subheader={(
          <div className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">
              Код:
              {form.name}
            </span>
            <span className="text-sm text-gray-500">
              Создано:
              {' '}
              {dayjs(parseInt(form.createdAt)).format('DD.MM.YYYY')}
            </span>
          </div>
        )}
        action={(
          <div className="flex gap-2">
            <IconButton onClick={() => onEdit(form)} size="small">
              <Edit />
            </IconButton>
            <IconButton
              onClick={() => onDelete(form.id)}
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

function FormsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);

  const { data, loading, refetch } = useQuery(GET_FORMS_AND_TABLES);

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedForm(null);
    refetch();
  };

  const handleDelete = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту форму?')) {
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
        <Typography variant="h4">Формы</Typography>
        <Button variant="contained" onClick={() => setIsFormOpen(true)}>
          Добавить форму
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.getAllForms?.map((form) => (
          <FormCard
            key={form.id}
            form={form}
            onEdit={(form) => {
              setSelectedForm(form);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <Dialog
        open={isFormOpen}
        onClose={handleCloseForm}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          {selectedForm ? 'Редактировать форму' : 'Создать форму'}
        </DialogTitle>
        <DialogContent>
          <FormEdit
            id={selectedForm?.id}
            onClose={handleCloseForm}
            tables={data?.getTables || []}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FormsPage;
