import S3Autocomplete from '@/components/guiElements/S3Autocomplete';
import { useState } from 'react';
import {
  Button, CircularProgress, MenuItem, TextField,
} from '@mui/material';
import { gql, useQuery } from '@apollo/client';
import DefaultEditor from 'react-simple-wysiwyg';
import { GET_PAGES } from '@/pages/admin/pages';
import { PageFormData } from '../entities/IPage';
import { IForm } from '../entities/IForm';
import { IWidget } from '../entities/IWidget';

export default function PageForm({
  initialData = {},
  onSubmit,
  onCancel,
}: {
  initialData: Partial<PageFormData>;
  onSubmit: (data: PageFormData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<PageFormData>({
    name: initialData.name || '',
    title: initialData.title || '',
    url: initialData.url || '',
    parentId: initialData.parentId,
    isRoot: initialData.isRoot || false,
    seotag: initialData.seotag || '',
    html: initialData.html || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

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

  const { data: pagesData, loading } = useQuery(GET_PAGES);

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="grid p-2 grid-cols-2 gap-4">
        <TextField
          label="Заголовок"
          fullWidth
          value={formData.title}
          onChange={(e) => setFormData({
            ...formData,
            title: e.target.value,
          })}
          required
        />
        <TextField
          label="SEO Тег"
          fullWidth
          value={formData.seotag}
          onChange={(e) => setFormData({ ...formData, seotag: e.target.value })}
        />
      </div>

      <div className="grid p-2 grid-cols-2 gap-4">
        <TextField
          label="URL"
          fullWidth
          value={formData.url}
          onChange={(e) => setFormData({
            ...formData,
            url:
                    e.target.value,
          })}
        />

        <S3Autocomplete
          label="Родитель"
          variant="outlined"
          value={formData.parentId}
          options={pagesData.getAllSiteItems}
          getOptionLabelFromKey="title"
          onChange={(e) => setFormData({ ...formData, parentId: typeof (e) === 'string' ? e : e?.[0] })}
        />
      </div>

      <h4>Контент</h4>
      <DefaultEditor
        value={formData.html}
        onChange={(e) => setFormData({ ...formData, html: e.target.value })}
      />

      <h4>Добавить виджеты</h4>
      <div>
        {snippets.data?.getAllWidgets?.map((widget: IWidget) => (
          <MenuItem
            key={widget.id}
            onClick={() => setFormData({
              ...formData,
              html:
                    `${formData.html}[widget:${widget.name}]`,
            })}
          >
            {widget.title}
          </MenuItem>
        ))}
      </div>
      <h4>Добавить формы</h4>
      <div>
        {snippets.data?.getAllForms?.map((form: IForm) => (
          <MenuItem
            key={form.id}
            onClick={() => setFormData({
              ...formData,
              html:
                    `${formData.html}[form:${form.name}]`,
            })}
          >
            {form.title}
          </MenuItem>
        ))}
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <Button variant="outlined" onClick={onCancel}>
          Отмена
        </Button>
        <Button variant="contained" type="submit">
          {initialData.id ? 'Обновить' : 'Создать'}
        </Button>
      </div>
    </form>
  );
}
