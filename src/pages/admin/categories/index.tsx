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
import S3Autocomplete from '@/components/guiElements/S3Autocomplete';

function CategoriesPage() {
  const router = useRouter();
  const [form, setForm] = useState<Partial<ICategory>>({
    title: '',
    parentCategoryId: '',
  });
  const [createCategory] = useMutation(gql`
    mutation CreateCategory($input: CategoryInput!) {
      createCategory(input: $input) {
        title
        parentCategoryId
        slug
      }
  }`);
  const { loading, data, refetch } = useQuery<{
    getCategories: ICategory[];
  }>(gql`
    query {
      getCategories {
        id
        title
        parentCategory {
          id
          title
        }
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
      {
        accessorKey: 'parentCategory.title',
        header: 'Родительская категория',
        size: 250,
      },
    ],
    [router],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const categories = data?.getCategories || [];

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
        data={categories}
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
        <DialogContent>
          <S3Autocomplete
            options={categories.map((category: { title: string; id: string; }) => ({
              name: category.title,
              id: category.id,
            }))}
            value={form.parentCategoryId}
            onChange={(newValue) => setForm({ ...form, parentCategoryId: newValue as string })}
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
