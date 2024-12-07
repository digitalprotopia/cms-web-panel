import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Edit, AccessTime, Delete,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import DefaultEditor from 'react-simple-wysiwyg';
import { IPost } from '@/components/entities/IPost';

const GET_POSTS = gql`
  query GetPosts {
    getPosts {
      id
      title
      content
      createdAt
    }
  }
`;

const CREATE_POST = gql`
  mutation CreatePost($input: PostInput!) {
    createPost(input: $input) {
      id
      title
      content
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
      createdAt
    }
  }
`;

const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

interface PostFormData {
  id?: string;
  title: string;
  content: string;
}

function PostForm({
  initialData = {},
  onSubmit,
  onCancel,
}: {
  initialData: Partial<PostFormData>;
  onSubmit: (data: PostFormData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<PostFormData>({
    title: initialData.title || '',
    content: initialData.content || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="grid grid-cols-2 gap-4">
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
        />
      </div>

      <h4>Контент</h4>
      <DefaultEditor
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
      />

      <div className="flex justify-end gap-2 mt-5">
        <Button variant="outlined" onClick={onCancel}>
          Отмена
        </Button>
        <Button variant="contained" type="submit">
          {initialData.id ? 'Обновить' : 'Создать'}
        </Button>
      </div>
    </form>
  );
}

function PostCard({
  post,
  onEdit,
  onDelete,
}: {
  post: IPost;
  onEdit: (post: IPost) => void;
  onDelete: (id: string) => void;
}) {
  // const formatDate = (dateString: string) => new Date(dateString).toLocaleString('ru-RU', {
  //   day: 'numeric',
  //   month: 'long',
  //   year: 'numeric',
  //   hour: '2-digit',
  //   minute: '2-digit',
  // });

  return (
    <Card>
      <CardHeader
        title={post.title}
        action={(
          <div>
            <IconButton onClick={() => onEdit(post)} size="small">
              <Edit />
            </IconButton>
            <IconButton
              onClick={() => onDelete(post.id)}
              size="small"
              color="error"
            >
              <Delete />
            </IconButton>
          </div>
        )}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {/* {post.url} */}
        </Typography>
        <div className="flex items-center">
          <AccessTime sx={{ fontSize: 16, marginRight: '4px' }} />
          <Typography variant="caption" color="text.secondary">
            {dayjs(post.createdAt).toString()}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}

function PostsPost() {
  const [selectedPost, setSelectedPost] = useState<IPost | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, loading, refetch } = useQuery(GET_POSTS);

  const [createPost] = useMutation(CREATE_POST, {
    onCompleted: () => {
      setIsFormOpen(false);
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при создании поста:', error);
    },
  });

  const [updatePost] = useMutation(UPDATE_POST, {
    onCompleted: () => {
      setIsFormOpen(false);
      setSelectedPost(null);
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при обновлении поста:', error);
    },
  });

  const [deletePost] = useMutation(DELETE_POST, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при удалении поста:', error);
    },
  });

  const handleCreate = (formData: PostFormData) => {
    createPost({ variables: { input: formData } });
  };

  const handleUpdate = (formData: PostFormData) => {
    if (!selectedPost) return;
    updatePost({
      variables: {
        id: selectedPost.id,
        input: formData,
      },
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот пост?')) {
      deletePost({ variables: { id } });
    }
  };

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
        <Typography variant="h4">Посты</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setSelectedPost(null);
            setIsFormOpen(true);
          }}
        >
          Добавить пост
        </Button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 p-4">
        {data?.getPosts?.map((post: IPost) => (
          <PostCard
            key={post.id}
            post={post}
            onEdit={(_post) => {
              setSelectedPost(_post);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <Dialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedPost(null);
        }}
        maxWidth="md"
        fullScreen
      >
        <DialogTitle>
          {selectedPost ? 'Редактировать пост' : 'Создать новый пост'}
        </DialogTitle>
        <DialogContent>
          <PostForm
            initialData={selectedPost || {}}
            onSubmit={selectedPost ? handleUpdate : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedPost(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PostsPost;
