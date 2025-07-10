import {
  Dialog,
  DialogTitle,
  Typography,
} from '@mui/material';

interface WidgetHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WidgetHistoryDialog({ isOpen, onClose }: WidgetHistoryDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h6">История версий</Typography>
      </DialogTitle>
    </Dialog>
  );
}
