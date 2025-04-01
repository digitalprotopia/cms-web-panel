// показать табличкой, в табличке "репостнуть в ленту публикаций"

import React, { useMemo, useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Edit, AccessTime, Delete, Repeat,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import Link from 'next/link';
import { MaterialReactTable, MRT_ColumnDef } from 'material-react-table';
import { IFeedTarget } from '@/components/entities/IFeedTarget';
import { useSnackbar } from 'notistack';

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
    getFeedTargets {
      id
      title
      url
    }
  }
`;

function PostsPost() {
  const { enqueueSnackbar } = useSnackbar();
  const { data, loading, refetch, error: loadingError } = useQuery(GET_POSTS);

  const [deletePost] = useMutation(gql`
    mutation DeletePost($id: ID!) {
      deletePost(id: $id)
    }
  `, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при удалении поста:', error);
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      deletePost({ variables: { id } });
    }
  };

  const [repostPost] = useMutation(gql`
    mutation RepostPost($id: ID!, $feedId: ID!) {
      repostPost(id: $id, feedId: $feedId)
    }`, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при переслании поста:', error);
    },
  });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, postId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedPostId(postId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPostId(null);
  };

  const handleRepost = async (feedId: string) => {
    if (!selectedPostId) return;
    try {
      const result = await repostPost({
        variables: {
          id: selectedPostId,
          feedId,
        },
      });
      if (result.data?.repostPost) {
        enqueueSnackbar('Запись успешно переслана', { variant: 'success' });
      } else {
        enqueueSnackbar('Ошибка при пересылке', { variant: 'error' });
      }
      handleMenuClose();
    } catch (error) {
      console.error('Repost failed:', error);
      enqueueSnackbar('Ошибка при попытке переслать запись', { variant: 'error' });
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
              onClick={(e) => handleMenuOpen(e, row.original.id)}
              size="small"
              color="primary"
            >
              <Repeat />
            </IconButton>
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

  if (loadingError) {
    return (
      <div className="flex items-center justify-center">
        <Typography variant="h4">Ошибка</Typography>
      </div>
    );
  }

  const feedOptions = data.getFeedTargets;

  const RepostMenu = (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
      MenuListProps={{
        'aria-labelledby': 'repost-menu',
      }}
    >
      {feedOptions.map((feed: IFeedTarget) => (
        <MenuItem
          key={feed.id}
          onClick={() => handleRepost(feed.id)}
        >
          {feed.title}
          {' '}
          {feed.url}
        </MenuItem>
      ))}
    </Menu>
  );

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
      {RepostMenu}
    </div>
  );
}

export default PostsPost;
