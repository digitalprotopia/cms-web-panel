import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { gql, useMutation } from '@apollo/client';
import { ISiteMenu } from '../entities/ISiteMenu';

const EDIT_SITE_MENU = gql`
  mutation EditSiteMenu($id: ID!, $input: SiteMenuInput!) {
    editSiteMenu(id: $id, input: $input) {
      id
      name
      title
      siteId
      updatedAt
    }
  }
`;

const GET_SITE_MENUS = gql`
  query GetSiteMenus($siteId: ID!) {
    getSiteMenus(siteId: $siteId) {
      id
      name
      title
    }
  }
`;

interface EditMenuDialogProps {
  open: boolean;
  onClose: () => void;
  menu: ISiteMenu | null;
  onSuccess: () => void;
}

export default function EditMenuDialog({ open, onClose, menu, onSuccess }: EditMenuDialogProps) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (menu) {
      setName(menu.name);
      setTitle(menu.title);
    }
  }, [menu]);

  const [editMenu] = useMutation(EDIT_SITE_MENU, {
    refetchQueries: [
      {
        query: GET_SITE_MENUS,
        variables: { siteId: menu?.siteId },
      },
    ],
    onCompleted: () => {
      onSuccess();
      onClose();
    },
  });

  const handleSubmit = async () => {
    if (!menu) return;

    await editMenu({
      variables: {
        id: menu.id,
        input: {
          name,
          title,
          siteId: menu.siteId,
        },
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Редактировать меню</DialogTitle>
      <DialogContent>
        <TextField
          label="Название"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Заголовок"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSubmit} variant="contained">
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
