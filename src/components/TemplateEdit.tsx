import { ITemplateGroup } from '@/components/entities/ITemplateGroup';
import { GET_TEMPLATE_GROUPS } from '@/app/admin/templateGroups/page';
import DefaultEditor from 'react-simple-wysiwyg';
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Button, TextField } from '@mui/material';
import { ITemplate, ITemplateFormData } from './entities/ITemplate';

export default function TemplateEdit({
  initialData,
  onSubmit,
}: {
  initialData: Partial<ITemplate>;
  onSubmit: (data: ITemplateFormData) => void;
}) {
  const {
    name = '', title = '', templateGroupId, html = '', css = '',
  } = initialData;

  const [formData, setFormData] = useState<ITemplateFormData>({
    name, title, templateGroupId, html, css,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Код"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <TextField
            label="Заголовок"
            fullWidth
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <h4>HTML</h4>
        <DefaultEditor
          value={formData.html}
          onChange={(e) => setFormData({ ...formData, html: e.target.value })}
        />

        <div className="flex flex-wrap gap-2">
          {[{ templateName: 'Add menu', templateHTML: 'menu' },
            { templateName: 'Add content', templateHTML: 'content' }]
            .map((field) => (
              <Button
                key={field.templateName}
                variant="contained"
                color="primary"
                onClick={() => setFormData({
                  ...formData,
                  html: `${formData.html}{${field.templateHTML}}`,
                })}
              >
                {`${field.templateName}`}
              </Button>
            ))}
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="contained" type="submit">
            Сохранить
          </Button>
        </div>
      </form>
    </div>
  );
}
