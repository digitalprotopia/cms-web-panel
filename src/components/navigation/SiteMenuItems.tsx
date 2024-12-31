import { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { gql, useMutation } from '@apollo/client';
import { ISiteMenuItem } from '../entities/ISiteMenuItem';

const UPDATE_MENU_ITEM = gql`
  mutation UpdateSiteMenuItem($id: ID!, $input: SiteMenuItemInput!) {
    updateSiteMenuItem(id: $id, input: $input) {
      id
      title
      name
      url
      order
      menuId
      parentId
      updatedAt
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

export default function SiteMenuItems({ items, menuId, onUpdate }: SiteMenuItemsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<ISiteMenuItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const [updateMenuItem] = useMutation(UPDATE_MENU_ITEM);
  const [deleteMenuItem] = useMutation(DELETE_MENU_ITEM);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, item: ISiteMenuItem) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const handleEditClick = () => {
    if (selectedItem) {
      setEditTitle(selectedItem.title);
      setEditUrl(selectedItem.url);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleEditSave = async () => {
    if (selectedItem) {
      await updateMenuItem({
        variables: {
          id: selectedItem.id,
          input: {
            title: editTitle,
            url: editUrl,
            menuId,
            order: selectedItem.order,
          },
        },
      });
      setEditDialogOpen(false);
      onUpdate();
    }
  };

  const handleDelete = async () => {
    if (selectedItem) {
      await deleteMenuItem({
        variables: {
          id: selectedItem.id,
        },
      });
      handleMenuClose();
      onUpdate();
    }
  };

  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  return (
    <>
      <List>
        {sortedItems.map((item) => (
          <ListItem
            key={item.id}
            secondaryAction={(
              <IconButton onClick={(e) => handleMenuOpen(e, item)}>
                <MoreVertIcon />
              </IconButton>
            )}
          >
            <ListItemText primary={item.title} secondary={item.url} />
          </ListItem>
        ))}
      </List>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditClick}>Редактировать</MenuItem>
        <MenuItem onClick={handleDelete}>Удалить</MenuItem>
      </Menu>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Редактировать пункт меню</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Название"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="URL"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleEditSave} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
