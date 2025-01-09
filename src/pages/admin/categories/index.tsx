import {
  gql, useMutation, useQuery,
} from '@apollo/client';
import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';
import { MaterialReactTable } from 'material-react-table';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField,
} from '@mui/material';
import { ICategory } from '@/components/entities/ICategory';

function CategoriesPage() {
  const router = useRouter();
  const [form, setForm] = useState<Partial<ICategory>>({
    title: '',
  });
  const [createCategory] = useMutation(gql`
    mutation CreateCategory($input: CategoryInput!) {
      createCategory(input: $input) {
        title
        slug
      }
  }`);
  const { loading, data, refetch } = useQuery(gql`
    query {
      getCategories {
        title
        slug
      }
    }
  `);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Название',
        size: 150,
      },
      {
        accessorKey: 'slug',
        header: 'Адрес',
        size: 150,
      },
    ],
    [router],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <div>
        <Button
          variant="contained"
          onClick={() => {
            setForm({
              title: '',
            });
            setIsModalOpen(true);
          }}
        >
          Добавить категорию
        </Button>
      </div>

      <MaterialReactTable
        columns={columns}
        data={data.getCategories}
        enableColumnResizing
        enableFullScreenToggle={false}
        enableDensityToggle
        enableColumnFilters
        enablePagination
        enableSorting
        muiTableProps={{
          sx: {
            tableLayout: 'fixed',
          },
        }}
        renderTopToolbarCustomActions={() => (
          <div className="px-4 py-2">
            <h1 className="text-xl font-bold">Категории</h1>
          </div>
        )}
      />
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogTitle>Добавить категорию</DialogTitle>
        <DialogContent>
          <TextField
            label="Название"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={async () => {
              await createCategory({ variables: { input: form } });
              refetch();
              setIsModalOpen(false);
            }}
          >
            Добавить
          </Button>
          <Button
            onClick={() => {
              setIsModalOpen(false);
            }}
          >
            Отмена
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default CategoriesPage;
