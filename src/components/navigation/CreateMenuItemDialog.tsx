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
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { ISiteItem } from '../entities/ISiteItem';
import { ISiteMenuItem } from '../entities/ISiteMenuItem';
import { CreateMenuItemDialogProps } from './types/types';
import { GET_SITE_PAGES } from '@/graphql/SiteItem';
import { GET_SITE_MENUS } from '@/graphql/SiteMenu';
import { CREATE_MENU_ITEM } from '@/graphql/SiteMenuItem';

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
  const { data: menuData } = useQuery<{
    getSiteMenus: Array<{ id: string; items: ISiteMenuItem[] }>;
  }>(GET_SITE_MENUS, {
    variables: { siteId },
  });

  const currentMenu = menuData?.getSiteMenus.find((menu) => menu.id === menuId);
  const existingItems = currentMenu?.items || [];

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

    // Check if this page is already in the menu
    const isDuplicate = existingItems.some((item) => selectedPage && item.url === selectedPage.url);

    if (isDuplicate) {
      alert('Эта страница уже добавлена в меню');
      return;
    }

    createMenuItem({
      variables: {
        input: {
          title: title || selectedPage?.title,
          url: url || selectedPage?.url,
          menuId,
          position: existingItems.length,
          name: (title || selectedPage?.title || '').toLowerCase().replace(/\s+/g, '-'),
        },
      },
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Добавить пункт меню</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Left side - Form */}
          <Box sx={{ flex: 1 }}>
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
          </Box>

          {/* Right side - Existing items */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Существующие пункты меню:
            </Typography>

            <Divider />

            <List dense>
              {existingItems.map((item) => (
                <ListItem key={item.id}>
                  <ListItemText primary={item.title} secondary={item.url} />
                </ListItem>
              ))}

              {existingItems.length === 0 && (
                <ListItem>
                  <ListItemText secondary="Пока нет добавленных пунктов меню" />
                </ListItem>
              )}
            </List>
          </Box>
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
