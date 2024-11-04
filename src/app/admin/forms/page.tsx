'use client';

import { IForm } from '@/components/entities/IForm';
import { gql, useQuery } from '@apollo/client';
import {
  Button, CircularProgress, MenuItem, Typography,
} from '@mui/material';
import Link from 'next/link';

function FormsPage(props) {
  const { data, loading } = useQuery(gql`
      query {
        getAllForms {
          id
          name
          title
          createdAt
        }
      }
  `);
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
        <Typography variant="h4">Формы</Typography>
        <Button
          variant="contained"
          onClick={() => {
            // setSelectedForm(null);
            // setIsFormOpen(true);
          }}
        >
          Добавить форму
        </Button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 p-4">
        {data?.getAllForms?.map((form: IForm) => (
          <Link href={`/admin/forms/${form.id}`} key={form.id}>
            <MenuItem>{form.title}</MenuItem>
          </Link>
          // <FormCard
          //   key={form.id}
          //   form={form}
          //   onEdit={(form) => {
          //     setSelectedForm(form);
          //     setIsFormOpen(true);
          //   }}
          //   onDelete={handleDelete}
          // />
        ))}
      </div>

      {/*
      <Dialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedForm(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedForm ? "Редактировать страницу" : "Создать новую страницу"}
        </DialogTitle>
        <DialogContent>
          <FormForm
            initialData={selectedForm || {}}
            onSubmit={selectedForm ? handleUpdate : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedForm(null);
            }}
          />
        </DialogContent>
      </Dialog> */}
    </div>
  );
}

export default FormsPage;
