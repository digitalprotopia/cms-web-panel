import { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { gql, useMutation } from '@apollo/client';
import { ISiteMenuItem } from '../entities/ISiteMenuItem';

const CREATE_MENU_ITEM = gql`
  mutation CreateSiteMenuItem($input: SiteMenuItemInput!) {
    createSiteMenuItem(input: $input) {
      id
      title
      url
      order
      createdAt
    }
  }
`;

const UPDATE_MENU_ITEM = gql`
  mutation UpdateSiteMenuItem($id: ID!, $input: SiteMenuItemInput!) {
    updateSiteMenuItem(id: $id, input: $input) {
      id
      title
      url
      order
    }
  }
`;

const DELETE_MENU_ITEM = gql`
  mutation DeleteSiteMenuItem($id: ID!) {
    deleteSiteMenuItem(id: $id)
  }
`;

interface SiteMenuItemsProps {
  items: ISiteMenuItem[];
  menuId: string;
  onUpdate: () => void;
}

interface MenuItemFormData {
  title: string;
  url: string;
}

export default function SiteMenuItems({ items, menuId, onUpdate }: SiteMenuItemsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ISiteMenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItemFormData>({ title: '', url: '' });

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingItem(null);
    setFormData({ title: '', url: '' });
  };

  const [createMenuItem] = useMutation(CREATE_MENU_ITEM, {
    onCompleted: () => {
      onUpdate();
      handleCloseDialog();
    },
  });

  const [updateMenuItem] = useMutation(UPDATE_MENU_ITEM, {
    onCompleted: () => {
      onUpdate();
      handleCloseDialog();
    },
  });

  const [deleteMenuItem] = useMutation(DELETE_MENU_ITEM, {
    onCompleted: onUpdate,
  });

  const handleEditClick = (item: ISiteMenuItem) => {
    setEditingItem(item);
    setFormData({ title: item.title, url: item.url });
  };

  const handleSubmit = async () => {
    if (editingItem) {
      await updateMenuItem({
        variables: {
          id: editingItem.id,
          input: {
            ...formData,
            menuId,
            order: editingItem.order,
          },
        },
      });
    } else {
      await createMenuItem({
        variables: {
          input: {
            ...formData,
            menuId,
            order: items.length,
          },
        },
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот пункт меню?')) {
      await deleteMenuItem({
        variables: { id },
      });
    }
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Button variant="outlined" size="small" onClick={() => setIsCreateDialogOpen(true)}>
          Добавить пункт меню
        </Button>
      </Box>

      <List>
        {items.map((item) => (
          <ListItem
            key={item.id}
            secondaryAction={
              <Box>
                <IconButton onClick={() => handleEditClick(item)} size="small">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(item.id)} size="small">
                  <DeleteIcon />
                </IconButton>
              </Box>
            }
          >
            <ListItemText primary={item.title} secondary={item.url} />
          </ListItem>
        ))}
        {items.length === 0 && (
          <Typography color="text.secondary" variant="body2">
            Нет пунктов меню
          </Typography>
        )}
      </List>

      <Dialog
        open={isCreateDialogOpen || !!editingItem}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? 'Редактировать пункт меню' : 'Добавить пункт меню'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Название"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            fullWidth
            margin="normal"
          />
          <TextField
            label="URL"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.title || !formData.url}
          >
            {editingItem ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
