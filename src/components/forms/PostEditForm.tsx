import { useState } from 'react';
import {
  Button,
  CircularProgress,
  TextField,
  Stack,
  Typography,
  IconButton,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { MuiChipsInput } from 'mui-chips-input';
import DefaultEditor from 'react-simple-wysiwyg';
import { gql, useMutation, useQuery } from '@apollo/client';
import { BlockNoteEditor } from '@blocknote/core';
import { ICategory } from '../entities/ICategory';
import { IPost } from '../entities/IPost';
import { ITag } from '../entities/ITag';
import S3Autocomplete, { Option } from '../guiElements/S3Autocomplete';
import BlockEditor from '../BlockEditor';
import { flattenIndexedTree, ItemWithParentId, makeIndexedTree } from '../guiElements/Tree';
import { IRole } from '../entities/IRole';
import PostHistoryDialog from '../dialogs/PostHistoryDialog';
import FileDialog from '../FileDialog'; // Импорт из src\components\FileDialog.tsx

const CREATE_POST = gql`
  mutation CreatePost($input: PostInput!) {
    createPost(input: $input) {
      id
      title
      content
      blockContent
      preview
      pictureFileId
      createdAt


      
    }
  }
`;

const UPDATE_POST = gql`
  mutation UpdatePost($id: ID!, $input: PostInput!) {
    editPost(id: $id, input: $input) {
      id
      title
      content
      preview
      blockContent
      pictureFileId
      createdAt
    }
  }
`;

interface PostFormProps {
  id?: string;
  onClose: () => void;
}

export default function PostForm({ id, onClose }: PostFormProps) {
  const [formData, setFormData] = useState<Partial<IPost>>({
    title: '',
    content: '',
    blockContent: [],
    preview: '',
    pictureFileId: null,
    tags: [],
    categoryIds: [],
    roleIds: [],
  });

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);

  const handleSelectedPost = (selectedPost: {
    title: string;
    blockContent: any;
    preview: string;
  }) => {
    if (editor !== null) {
      editor.replaceBlocks(editor.document, selectedPost.blockContent);
    }
    setFormData((prev) => ({
      ...prev,
      title: selectedPost.title,
      blockContent: selectedPost.blockContent,
      preview: selectedPost.preview,
    }));
  };

  const linkData = useQuery(gql`
    query {
      getTags {
        id
        title
      }
      getCategories {
        id
        title
        parentCategory {
          id
          title
        }
      }
      getRoles {
        id
        name
      }
    }
  `);

  const initialData = useQuery(gql`
    query ($id: ID!) {
      getPost(id: $id) {
        id
        title
        content
        blockContent
        preview
        pictureFileId
        createdAt
        categories {
          id
          title
        }
        roles {
          id
          title
        }
        tags {
          id
          title
        }
      }
    }
  `, {
    variables: { id },
    skip: !id,
    onCompleted: (data) => {
      setFormData({
        title: data.getPost.title,
        content: data.getPost.content,
        blockContent: data.getPost.blockContent,
        preview: data.getPost.preview,
        pictureFileId: data.getPost.pictureFileId,
        tags: data.getPost.tags.map((tag: ITag) => tag.title),
        categoryIds: data.getPost.categories.map((category: ICategory) => category.id),
        roleIds: data.getPost.roles.map((role: IRole) => role.id),
      });
    },
  });

  const [createPost] = useMutation(CREATE_POST, {
    onError: (error) => {
      console.error('Ошибка при создании поста:', error);
    },
  });

  const [updatePost] = useMutation(UPDATE_POST, {
    onError: (error) => {
      console.error('Ошибка при обновлении поста:', error);
    },
  });

  const categoriesWithParentIds: ItemWithParentId[] = linkData.data?.getCategories?.map(
    (category: ICategory) => ({
      ...category,
      parentId: category.parentCategory?.id,
    }),
  );

  const roles: Option[] | undefined = linkData.data?.getRoles?.map(
    (role: IRole) => ({
      id: role.id,
      name: role.name,
    }),
  );

  const handleCreate = async (_formData: Partial<IPost>) => {
    await createPost({ variables: { input: _formData } });
    onClose();
  };

  const handleUpdate = async (_formData: Partial<IPost>) => {
    await updatePost({
      variables: {
        id,
        input: _formData,
      },
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (id) {
      handleUpdate(formData);
    } else {
      handleCreate(formData);
    }
  };

  if (!linkData.data || (id && !initialData.data?.getPost?.id)) {
    return (
      <div className="flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography
          variant="h4"
          sx={{
            display: document.location.pathname.endsWith('/add') ? 'none' : 'block',
          }}
        >
          Редактировать запись
        </Typography>
        {id && (
          <IconButton
            color="secondary"
            aria-label="История изменений"
            onClick={() => setHistoryDialogOpen(true)}
            sx={{
              color: 'black',
              '&:hover': {
                backgroundColor: 'rgba(233, 30, 99, 0.1)',
              },
            }}
          >
            <HistoryIcon />
          </IconButton>
        )}
      </Stack>

      <form onSubmit={handleSubmit} className="p-4">
        <div>
          <div className="grid p-2 grid-cols-2 gap-4">
            <TextField
              label="Заголовок"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              slotProps={{
                htmlInput: { maxLength: 255 },
              }}
            />

            <MuiChipsInput
              label="Теги"
              value={formData.tags}
              onChange={(_tags) => setFormData({ ...formData, tags: _tags })}
            />
          </div>

          <div className="grid p-2 grid-cols-2 gap-4">
            <S3Autocomplete
              multiple
              label="Категории"
              value={formData.categoryIds}
              options={flattenIndexedTree(makeIndexedTree(categoriesWithParentIds))?.map(
                (category) => ({
                  id: category.id,
                  name: category.title,
                  level: category.level,
                }),
              )}
              onChange={(categoryIds) => setFormData({
                ...formData,
                categoryIds: categoryIds as string[],
              })}
              renderOption={(option) => (
                <div style={{ paddingLeft: option.level * 20 }}>{option.name}</div>
              )}
            />
            <S3Autocomplete
              value={formData.roleIds}
              onChange={(value) => setFormData({ ...formData, roleIds: value as string[] })}
              options={roles}
              multiple
              label="Роли"
            />
          </div>
        </div>

        {/* Поле для выбора изображения поста */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <h4>Изображение поста</h4>
          <FileDialog
            fileId={formData.pictureFileId}
            onChange={(pictureFileId) => {
              setFormData({ ...formData, pictureFileId });
            }}
          />
        </Stack>

        <h4>Блочный редактор</h4>
        <BlockEditor
          initialData={initialData.data?.getPost?.blockContent}
          onChange={(blockContent) => setFormData({ ...formData, blockContent })}
          setEditor={setEditor}
        />

        <h4>Контент</h4>
        <DefaultEditor
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        />

        <h4>Превью</h4>
        <DefaultEditor
          value={formData.preview}
          onChange={(e) => setFormData({ ...formData, preview: e.target.value })}
        />

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outlined" onClick={() => onClose()}>
            Отмена
          </Button>
          <Button variant="contained" type="submit">
            {id ? 'Обновить' : 'Создать'}
          </Button>
        </div>
      </form>

      {id && (
        <PostHistoryDialog
          open={historyDialogOpen}
          postId={id as string}
          onClose={() => setHistoryDialogOpen(false)}
          onRestorePost={handleSelectedPost}
        />
      )}
    </>
  );
}
