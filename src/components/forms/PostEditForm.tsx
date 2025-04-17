import { useState } from 'react';
import { Button, CircularProgress, TextField } from '@mui/material';
import { MuiChipsInput } from 'mui-chips-input';
import DefaultEditor from 'react-simple-wysiwyg';
import { gql, useMutation, useQuery } from '@apollo/client';
import { ICategory } from '../entities/ICategory';
import { IPost } from '../entities/IPost';
import { ITag } from '../entities/ITag';
import S3Autocomplete, { Option } from '../guiElements/S3Autocomplete';
import BlockEditor from '../BlockEditor';
import { flattenIndexedTree, ItemWithParentId, makeIndexedTree } from '../guiElements/Tree';
import { IRole } from '../entities/IRole';

const CREATE_POST = gql`
  mutation CreatePost($input: PostInput!) {
    createPost(input: $input) {
      id
      title
      content
      blockContent
      preview
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
      createdAt
    }
  }
`;

export default function PostForm({
  id,
  onClose,
}: {
  id?: string;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<IPost>>({
    title: '',
    content: '',
    blockContent: [],
    preview: '',
    tags: [],
    categoryIds: [],
    roleIds: [],
  });

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

  const categoriesWithParentIds: ItemWithParentId[] = linkData.data?.getCategories
    .map((category: ICategory) => ({
      ...category,
      parentId: category.parentCategory?.id,
    }));

  const roles: Option[] | undefined = linkData.data?.getRoles.map(
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

  // const snippets = useQuery(gql`
  //   query {
  //     getAllWidgets {
  //       id
  //       name
  //       title
  //       createdAt
  //     }
  //     getAllForms {
  //       id
  //       name
  //       title
  //       createdAt
  //     }
  // }`);

  if (!linkData.data || (id && !initialData.data?.getPost?.id)) {
    return (
      <div className="flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div>
        <div className="grid p-2 grid-cols-2 gap-4">
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
            options={flattenIndexedTree(makeIndexedTree(categoriesWithParentIds))
              .map((category) => ({
                id: category.id,
                name: category.title,
                level: category.level,
              }))}
            onChange={(categoryIds) => setFormData({
              ...formData,
              categoryIds: categoryIds as string[],
            })}
            renderOption={(option) => (
              <div style={{ paddingLeft: option.level * 20 }}>
                {option.name}
              </div>
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

      <h4>Блочный редактор</h4>
      <BlockEditor
        initialData={initialData.data?.getPost?.blockContent}
        onChange={(blockContent) => setFormData({ ...formData, blockContent })}
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
  );
}
