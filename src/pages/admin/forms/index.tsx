import React from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  Card,
  CardHeader,
  Button,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import dayjs from 'dayjs';
import { IForm } from '@/components/entities/IForm';
import Link from 'next/link';

const GET_FORMS = gql`
  query {
    getAllForms {
      id
      name
      title
      createdAt
    }
  }
`;

function FormCard({ form, onDelete }: {
  form: Partial<IForm>;
  onDelete: (id: string) => void;
}) {
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
              {dayjs(form.createdAt).format('DD.MM.YYYY')}
            </span>
          </div>
        )}
        action={(
          <div className="flex gap-2">
            <Link href={`/admin/forms/${form.id}`}>
              <IconButton size="small">
                <Edit />
              </IconButton>
            </Link>
            <IconButton
              onClick={() => onDelete(form.id!)}
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
  const { data, loading } = useQuery(GET_FORMS);

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить эту форму?')) {
      //
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
        <Link href="/admin/forms/add">
          <Button variant="contained">
            Добавить форму
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.getAllForms?.map((form: any) => (
          <FormCard
            key={form.id}
            form={form}
            onDelete={handleDelete}
          />
        ))}
      </div>

    </div>
  );
}

export default FormsPage;
