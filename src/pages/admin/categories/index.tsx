import {
  gql, useMutation, useQuery,
} from '@apollo/client';
import { useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField,
} from '@mui/material';
import { ICategory } from '@/components/entities/ICategory';
import S3Autocomplete from '@/components/guiElements/S3Autocomplete';
import { DndProvider } from 'react-dnd'; import {
  Tree,
  getBackendOptions,
  MultiBackend,
  TreeProps,
} from '@minoru/react-dnd-treeview';

function CategoriesPage() {
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
  const [editCategory] = useMutation(gql`
    mutation EditCategory($id: ID!, $input: CategoryInput!) {
      editCategory(id: $id, input: $input) {
        parentCategoryId
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const categories = data?.getCategories || [];
  const treeData = categories.map((category: ICategory) => ({
    id: category.id,
    text: category.title,
    data: {
      slug: category.slug,
    },
    droppable: true,
    parent: category.parentCategory?.id || 0,
  }));

  const handleDrop: TreeProps['onDrop'] = async (newTree, { dragSourceId, dropTargetId }) => {
    await editCategory({
      variables: {
        id: dragSourceId,
        input: {
          parentCategoryId: dropTargetId === 0 ? null : dropTargetId,
        },
      },
    });
    refetch();
  };

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
      <div className="rounded shadow-lg">
        <div className="px-4 py-2">
          <h1 className="text-xl font-bold">Категории</h1>
        </div>
        <style>
          {`
        .treeContainer > ul {
          padding-left: 40px;
          padding-right: 0px;
          padding-bottom: 10px;
          padding-top: 10px;
        }
        `}
        </style>
        <div className="treeContainer">
          <DndProvider backend={MultiBackend} options={getBackendOptions()}>
            <Tree
              tree={treeData}
              rootId={0}
              render={(node, { depth, isOpen, onToggle }) => (
                <div className="flex items-center gap-4" style={{ marginLeft: depth * 10 }}>
                  <div>
                    {node.droppable && (
                    <span onClick={onToggle}>{isOpen ? '[-]' : '[+]'}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    {node.text}
                  </div>
                  <div className="flex-1">
                    {node.data?.slug || ''}
                  </div>
                </div>
              )}
              onDrop={handleDrop}
            />
          </DndProvider>
        </div>
      </div>

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
