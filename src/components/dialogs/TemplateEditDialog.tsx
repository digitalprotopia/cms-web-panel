import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import TemplateEdit from '../TemplateEdit';
import { ITemplate, TemplateFormData } from '../entities/ITemplate';

interface TemplateEditDialogProps {
  isOpen: boolean,
  selectedTemplate: ITemplate | null, onSubmit: (data: TemplateFormData) => void,
  onClose: () => void,
  onCancel: () => void,
}

export default function TemplateEditDialog({
  isOpen, selectedTemplate, onSubmit, onClose, onCancel,
}: TemplateEditDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {selectedTemplate ? 'Редактировать шаблон' : 'Создать новый шаблон'}
      </DialogTitle>
      <DialogContent>
        <TemplateEdit
          initialData={selectedTemplate || {}}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
