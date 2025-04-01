// показать табличкой, в табличке "репостнуть в ленту публикаций"

import React, { useMemo } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Button,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Edit, AccessTime, Delete, Repeat,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { IPost } from '@/components/entities/IPost';
import Link from 'next/link';
import { MaterialReactTable, MRT_ColumnDef } from 'material-react-table';

const GET_POSTS = gql`
  query GetPosts {
    getPosts {
      id
      title
      slug
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

  const columns: MRT_ColumnDef<any, any>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 400,
      },
      {
        accessorKey: 'title',
        header: 'Заголовок',
        size: 150,
        Cell: ({ row }) => (
          <div>
            {row.original.title}
          </div>
        ),
      },
      {
        accessorKey: 'slug',
        header: 'Слаг',
        size: 150,
      },
      {
        accessorKey: 'createdAt',
        header: 'Дата создания',
        size: 150,
        Cell: ({ row }) => (
          <div className="flex items-center">
            <AccessTime sx={{ fontSize: 16, marginRight: '4px' }} />
            <Typography variant="caption" color="text.secondary">
              {dayjs(row.original.createdAt).toString()}
            </Typography>
          </div>
        ),
      },
      {
        accessorKey: 'actions',
        header: 'Действия',
        size: 150,
        Cell: ({ row }) => (
          <div className="flex gap-2">
            <Link href={`/admin/posts/${row.original.id}`}>
              <IconButton size="small">
                <Edit />
              </IconButton>
            </Link>
            <IconButton
              onClick={() => handleDelete(row.original.id)}
              size="small"
              color="error"
            >
              <Delete />
            </IconButton>
          </div>
        ),
      },
    ],
    [refetch],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <div className="flex items-center gap-4 mb-4">
        <Typography variant="h4">Посты</Typography>
        <Link href="/admin/posts/add">
          <Button
            variant="contained"
          >
            Добавить пост
          </Button>
        </Link>
      </div>

      <MaterialReactTable
        columns={columns}
        data={data.getPosts}
        enableColumnResizing
        enableFullScreenToggle={false}
        enableDensityToggle
        enableColumnFilters
        enablePagination
        enableSorting
        initialState={{
          columnVisibility: {
            id: false,
          },
        }}
        muiTableProps={{
          sx: {
            tableLayout: 'fixed',
          },
        }}
      />
    </div>
  );
}

export default PostsPost;
