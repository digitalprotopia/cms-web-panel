import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { useState } from 'react';

interface CreateMenuDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, title: string) => Promise<void>;
}

export default function CreateMenuDialog({ open, onClose, onSubmit }: CreateMenuDialogProps) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');

  const handleSubmit = async () => {
    await onSubmit(name, title);
    setName('');
    setTitle('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Создать меню</DialogTitle>
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
        <Button onClick={handleSubmit} variant="contained" disabled={!name || !title}>
          Создать
        </Button>
      </DialogActions>
    </Dialog>
  );
}
