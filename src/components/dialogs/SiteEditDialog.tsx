import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import SiteForm from '../SiteEdit';
import { ISite, SiteFormData } from '../entities/ISite';

interface SiteEditDialogProps {
  isOpen: boolean,
  selectedSite: ISite | null, onSubmit: (data: SiteFormData) => void,
  onClose: () => void,
  onCancel: () => void,
}

export default function SiteEditDialog({
  isOpen, onClose, selectedSite, onSubmit, onCancel,
}: SiteEditDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {selectedSite ? 'Редактировать сайт' : 'Создать новый сайт'}
      </DialogTitle>
      <DialogContent>
        <SiteForm
          initialData={selectedSite || {}}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
