import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { ISiteItem } from '../entities/ISiteItem';

export const GET_SITE_PAGES = gql`
  query GetAllSiteItems {
    getRoles {
      id
      name
    }
    getAllSiteItems {
      id
      name
      title
      url
      parentId
      isRoot
      seotag
      html
      roles {
        id
        name
      }
      type
      createdAt
      updatedAt
    }
  }
`;

const CREATE_MENU_ITEM = gql`
  mutation CreateSiteMenuItem($input: SiteMenuItemInput!) {
    createSiteMenuItem(input: $input) {
      id
      title
      name
      url
      order
      menuId
      parentId
      createdAt
    }
  }
`;

const GET_SITE_MENUS = gql`
  query GetSiteMenus($siteId: ID!) {
    getSiteMenus(siteId: $siteId) {
      id
      name
      title
      items {
        id
        title
        url
        order
      }
      createdAt
      updatedAt
    }
  }
`;

interface CreateMenuItemDialogProps {
  open: boolean;
  onClose: () => void;
  menuId: string;
  siteId: string;
  onSuccess: () => void;
}

export default function CreateMenuItemDialog({
  open,
  onClose,
  menuId,
  siteId,
  onSuccess,
}: CreateMenuItemDialogProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [selectedPageId, setSelectedPageId] = useState<string>('');

  const { data: pagesData } = useQuery<{ getAllSiteItems: ISiteItem[] }>(GET_SITE_PAGES);

  const handleClose = () => {
    setTitle('');
    setUrl('');
    setSelectedPageId('');
    onClose();
  };

  const [createMenuItem] = useMutation(CREATE_MENU_ITEM, {
    onCompleted: () => {
      onSuccess();
      handleClose();
    },
    refetchQueries: [
      {
        query: GET_SITE_MENUS,
        variables: { siteId },
      },
    ],
  });

  const handleSubmit = () => {
    const selectedPage = pagesData?.getAllSiteItems.find((page) => page.id === selectedPageId);

    createMenuItem({
      variables: {
        input: {
          title: title || selectedPage?.title,
          url: url || selectedPage?.url,
          menuId,
          order: 0,
          name: (title || selectedPage?.title || '').toLowerCase().replace(/\s+/g, '-'),
        },
      },
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Добавить пункт меню</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Страница сайта</InputLabel>
            <Select
              value={selectedPageId}
              label="Страница сайта"
              onChange={(e) => setSelectedPageId(e.target.value)}
            >
              <MenuItem value="">
                <em>Произвольная ссылка</em>
              </MenuItem>
              {pagesData?.getAllSiteItems.map((page) => (
                <MenuItem key={page.id} value={page.id}>
                  {page.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {!selectedPageId && (
            <>
              <TextField
                label="Название"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
              />
              <TextField
                label="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                fullWidth
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Отмена</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!selectedPageId && (!title || !url)}
        >
          Добавить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
