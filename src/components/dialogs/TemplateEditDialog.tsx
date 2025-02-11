import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import TemplateEdit from '../TemplateEdit';
import { ITemplate } from '../entities/ITemplate';

interface TemplateEditDialogProps {
  isOpen: boolean,
  selectedTemplate: Partial<ITemplate> | null, onSubmit: (data: Partial<ITemplate>) => void,
  onClose: () => void,
  // onCancel: () => void,
}

export default function TemplateEditDialog({
  isOpen, selectedTemplate, onSubmit, onClose,
}: TemplateEditDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullScreen
    >
      <DialogTitle>
        {selectedTemplate ? 'Редактировать шаблон' : 'Создать новый шаблон'}
      </DialogTitle>
      <DialogContent>
        <TemplateEdit
          initialData={selectedTemplate || {}}
          onSubmit={onSubmit}
          // onCancel={onCancel}
          templates={[]}
        />
      </DialogContent>
    </Dialog>
  );
}
