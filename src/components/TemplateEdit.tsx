import { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Button, MenuItem, TextField } from '@mui/material';
import { Editor } from '@monaco-editor/react';
import { ITemplate, ITemplateFormData, TemplateType } from './entities/ITemplate';

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
            label="Имя файла"
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
        <div>
          <a href={`${window.config.server}/templates/${initialData.id}/${initialData.name}`} target="_blank" rel="noreferrer">
            {`URL: ${window.config.server}/templates/${initialData.id}/${initialData.name}`}
          </a>
        </div>

        {initialData.type === TemplateType.TEXT ? (
          <>
            <h4>HTML</h4>
            <Editor
              value={formData.html}
              height={400}
              onChange={(value) => setFormData({ ...formData, html: value! })}
              language={formData.name.endsWith('.css') ? 'css' : 'html'}
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

            <div style={{ display: 'flex', width: '100%' }}>
              <div>
                <h4>Добавить виджеты</h4>
                <div style={{ height: 160, overflow: 'auto' }}>
                  {snippets.data?.getAllWidgets?.map((widget: any) => (
                    <MenuItem key={widget.id} onClick={() => setFormData({ ...formData, html: `${formData.html}[widget:${widget.name}]` })}>
                      {widget.title}
                    </MenuItem>
                  ))}
                </div>
              </div>
              <div>
                <h4>Добавить формы</h4>
                <div style={{ height: 160, overflow: 'auto' }}>
                  {snippets.data?.getAllForms?.map((form: any) => (
                    <MenuItem key={form.id} onClick={() => setFormData({ ...formData, html: `${formData.html}[form:${form.name}]` })}>
                      {form.title}
                    </MenuItem>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h4>Добавить шаблоны</h4>
              <div style={{ height: 160, overflow: 'auto' }}>
                {templates.map((template) => (
                  <MenuItem key={template.name} onClick={() => setFormData({ ...formData, html: `${formData.html}{include:${template.name}}` })}>
                    {template.title}
                  </MenuItem>
                ))}
              </div>
            </div>
          </>
        ) : null}
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="contained" type="submit">
            Сохранить
          </Button>
        </div>
      </form>
    </div>
  );
}
