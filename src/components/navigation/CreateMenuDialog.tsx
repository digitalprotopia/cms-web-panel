import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { CreateMenuDialogProps } from './types/types';

export default function CreateMenuDialog({ open, onClose, onSubmit }: CreateMenuDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
  });

  const handleSubmit = async () => {
    await onSubmit(formData.name, formData.title);
    setFormData({ name: '', title: '' });
    onClose();
  };

  // eslint-disable-next-line max-len
  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Создать меню</DialogTitle>

      <DialogContent>
        <TextField
          label="Название"
          value={formData.title}
          onChange={handleChange('title')}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Техническое название"
          value={formData.name}
          onChange={handleChange('name')}
          fullWidth
          margin="normal"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.name || !formData.title}
        >
          Создать
        </Button>
      </DialogActions>
    </Dialog>
  );
}
