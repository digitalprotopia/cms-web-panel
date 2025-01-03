import { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Button, MenuItem, TextField } from '@mui/material';
import { ITemplate, ITemplateFormData } from './entities/ITemplate';

export default function TemplateEdit({
  initialData,
  onSubmit,
  templates,
}: {
  initialData: Partial<ITemplate>;
  onSubmit: (data: ITemplateFormData) => void;
  templates: ITemplateFormData[];
}) {
  const {
    name = '', title = '', templateGroupId, html = '', css = '',
  } = initialData;

  const snippets = useQuery(gql`
    query {
      getAllWidgets {
        id
        name
        title
        createdAt
      }
      getAllForms {
        id
        name
        title
        createdAt
      }
  }`);

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
        <TextField
          multiline
          fullWidth
          value={formData.html}
          onChange={(e) => setFormData({ ...formData, html: e.target.value })}
        />

        <div className="flex flex-wrap gap-2">
          {[{ templateName: 'Add menu', templateHTML: 'menu' },
            { templateName: 'Add content', templateHTML: 'content' },
            { templateName: 'Add title', templateHTML: 'title' },
          ]
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

        <h4>Добавить виджеты</h4>
        <div>
          {snippets.data?.getAllWidgets?.map((widget: any) => (
            <MenuItem key={widget.id} onClick={() => setFormData({ ...formData, html: `${formData.html}[widget:${widget.name}]` })}>
              {widget.title}
            </MenuItem>
          ))}
        </div>
        <h4>Добавить формы</h4>
        <div>
          {snippets.data?.getAllForms?.map((form: any) => (
            <MenuItem key={form.id} onClick={() => setFormData({ ...formData, html: `${formData.html}[form:${form.name}]` })}>
              {form.title}
            </MenuItem>
          ))}
        </div>
        <h4>Добавить шаблоны</h4>
        <div>
          {templates.map((template) => (
            <MenuItem key={template.name} onClick={() => setFormData({ ...formData, html: `${formData.html}{include:${template.name}}` })}>
              {template.title}
            </MenuItem>
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
