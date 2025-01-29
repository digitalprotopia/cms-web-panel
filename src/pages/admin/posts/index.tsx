import React from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Edit, AccessTime, Delete,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { IPost } from '@/components/entities/IPost';
import Link from 'next/link';

const GET_POSTS = gql`
  query GetPosts {
    getPosts {
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
      tags {
        id
        title
      }
    }
    getTags {
      id
      title
    }
    getCategories {
      id
      title
    }
  }
`;

const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

function PostCard({
  post,
  onDelete,
}: {
  post: IPost;
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
            <Link href={`/admin/posts/${post.id}`}>
              <IconButton size="small">
                <Edit />
              </IconButton>
            </Link>
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
  const { data, loading, refetch } = useQuery(GET_POSTS);

  const [deletePost] = useMutation(DELETE_POST, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при удалении поста:', error);
    },
  });

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
        <Link href="/admin/posts/add">
          <Button
            variant="contained"
          >
            Добавить пост
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 p-4">
        {data?.getPosts?.map((post: IPost) => (
          <PostCard
            key={post.id}
            post={post}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default PostsPost;
