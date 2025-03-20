import { gql, useMutation, useQuery } from '@apollo/client';
import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from '@mui/material';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ICategory } from '@/components/entities/ICategory';
import S3Autocomplete from '@/components/guiElements/S3Autocomplete';
import slugify from 'slugify';
import { DndProvider } from 'react-dnd';
import {
  Tree,
  getBackendOptions,
  MultiBackend,
  TreeProps,
} from '@minoru/react-dnd-treeview';

function CategoriesPage() {
  const [form, setForm] = useState<Partial<ICategory>>({
    id: '',
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
    }
  `);
  const [editCategory] = useMutation(gql`
    mutation EditCategory($id: ID!, $input: CategoryInput!) {
      editCategory(id: $id, input: $input) {
        parentCategoryId
      }
    }
  `);
  const [deleteCategory] = useMutation(gql`
    mutation DeleteCategory($id: ID!) {
      deleteCategory(id: $id)
    }
  `);
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
  const [isDeletionOpen, setIsDeletionOpen] = useState(false);
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

  const handleDrop: TreeProps['onDrop'] = async (
    newTree,
    { dragSourceId, dropTargetId },
  ) => {
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

  const handleDelete = async (id: string, title: string) => {
    setForm({ ...form, id, title });
    setIsDeletionOpen(true);
    refetch();
  };

  const handleToggle = (
    e: React.MouseEvent,
    onToggle: (id: number | string) => void,
    id: number | string,
  ) => {
    e.stopPropagation();
    onToggle(id);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  let categoryExists = false;
  if (form.id) {
    categoryExists = categories.some(
      (category: ICategory) => category.title === form.title && category.id !== form.id,
    );
  } else {
    categoryExists = categories.some(
      (category: ICategory) => category.title === form.title,
    );
  }

  let slugExists = false;
  const slug = slugify(form.title || '');
  if (form.id) {
    slugExists = categories.some(
      (category: ICategory) => category.slug === slug && category.id !== form.id,
    );
  } else {
    slugExists = categories.some(
      (category: ICategory) => category.slug === slug,
    );
  }

  const dialogType = form.id ? 'Редактировать' : 'Добавить';
  const categoriesDialog = (
    <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
      <DialogTitle>
        {dialogType}
        {' '}
        категорию
      </DialogTitle>
      <DialogContent>
        <TextField
          label="Название"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          variant="standard"
          error={form.title === '' || categoryExists || slugExists}
          helperText={(form.title === '' && 'Название не может быть пустым')
            || (categoryExists && 'Категория с таким названием уже существует.')
            || (slugExists && 'Категория с таким адресом уже существует.')}
        />
      </DialogContent>
      <DialogContent>
        <S3Autocomplete
          options={categories.map(
            (category: { title: string; id: string }) => ({
              name: category.title,
              id: category.id,
            }),
          )}
          label="Родительская категория"
          value={form.parentCategoryId}
          onChange={(newValue) => setForm({ ...form, parentCategoryId: newValue as string })}
        />
      </DialogContent>
      <DialogActions>
        <Button
          disabled={form.title === '' || categoryExists || slugExists}
          onClick={async () => {
            if (form.id) {
              await editCategory({
                variables: {
                  id: form.id,
                  input: {
                    title: form.title,
                    parentCategoryId: form.parentCategoryId,
                  },
                },
              });
            } else {
              await createCategory({ variables: { input: form } });
            }
            refetch();
            setIsModalOpen(false);
          }}
        >
          {dialogType}
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
  );
  const deletionDialog = (
    <Dialog open={isDeletionOpen} onClose={() => setIsDeletionOpen(false)}>
      <DialogTitle>Удаление категории</DialogTitle>
      <DialogContent>
        Вы уверены, что хотите удалить категорию
        {' '}
        &quot;
        {form.title}
        &quot;
        ?
      </DialogContent>
      <DialogActions>
        <Button
          onClick={async () => {
            await deleteCategory({ variables: { id: form.id } });
            refetch();
            setIsDeletionOpen(false);
          }}
        >
          Удалить
        </Button>
        <Button
          onClick={() => {
            setIsDeletionOpen(false);
          }}
        >
          Отмена
        </Button>
      </DialogActions>
    </Dialog>
  );

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
          padding-left: 10px;
          padding-right: 0px;
          padding-bottom: 10px;
          padding-top: 10px;
        }

        .expandIconWrapper {
          align-items: center;
          font-size: 0;
          cursor: pointer;
          display: flex;
          height: 24px;
          justify-content: center;
          width: 24px;
          transition: transform linear .1s;
          transform: rotate(0deg);
        }

        .expandIconWrapper.isOpen {
          transform: rotate(90deg);
        }
        `}
        </style>
        <div className="treeContainer">
          <DndProvider backend={MultiBackend} options={getBackendOptions()}>
            <Tree
              initialOpen
              tree={treeData}
              rootId={0}
              render={(node, { depth, isOpen, onToggle, hasChild }) => (
                <div
                  className="flex items-center gap-2 py-2"
                  style={{ marginLeft: depth * 10 }}
                >
                  <div
                    className={`expandIconWrapper ${
                      isOpen ? 'isOpen' : ''
                    } ${hasChild ? '' : 'invisible'}`}
                  >
                    {node.droppable && (
                      <div onClick={(e) => handleToggle(e, onToggle, node.id)}>
                        <ArrowRightIcon />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <div className="pr-4">
                      <div className="text-lg">{node.text}</div>
                      <div className="text-xs text-gray-500 ">
                        {node.data?.slug || ''}
                      </div>
                    </div>

                    <div>
                      <IconButton
                        onClick={() => {
                          setForm({
                            id: node.id as string,
                            title: node.text,
                            parentCategoryId:
                              (node.parent as string) || undefined,
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          handleDelete(node.id as string, node.text);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </div>
                  </div>
                </div>
              )}
              onDrop={handleDrop}
            />
          </DndProvider>
        </div>
      </div>
      {categoriesDialog}
      {deletionDialog}
    </div>
  );
}

export default CategoriesPage;
