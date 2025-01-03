import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { EditMenuDialogProps } from './types/types';
import { EDIT_SITE_MENU, GET_SITE_MENUS } from '@/graphql/SiteMenu';

export default function EditMenuDialog({ open, onClose, menu, onSuccess }: EditMenuDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
  });

  useEffect(() => {
    if (menu) {
      const { name, title } = menu;

      setFormData({
        name,
        title,
      });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!menu) return;

    const { id, siteId } = menu;

    await editMenu({
      variables: {
        id,
        input: {
          ...formData,
          siteId,
        },
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Редактировать меню</DialogTitle>

      <DialogContent>
        <TextField
          name="name"
          label="Название"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />

        <TextField
          name="title"
          label="Заголовок"
          value={formData.title}
          onChange={handleChange}
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
