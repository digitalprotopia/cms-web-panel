import S3Autocomplete from '@/components/guiElements/S3Autocomplete';
import { useState } from 'react';
import {
  Button, CircularProgress, MenuItem, TextField,
} from '@mui/material';
import { gql, useQuery } from '@apollo/client';
import { ISiteItem, SiteItemType, siteItemTypeNames } from '../entities/ISiteItem';
import { IRole } from '../entities/IRole';
import BlockEditor from '../BlockEditor';

export const GET_PAGES = gql`
  query GetAllSiteItems {
    getRoles {
      id
      name
    }
    getAllSiteItems {
      id
      name
      title
      url
      parentId
      isRoot
      seotag
      html
      blockContent
      roles {
        id
        name
      }
      type
      createdAt
      updatedAt
    }
  }
`;

export default function PageForm({
  initialData = {},
  onSubmit,
  onCancel,
  roles,
}: {
  initialData: Partial<ISiteItem>;
  onSubmit: (data: Partial<ISiteItem>) => void;
  onCancel: () => void;
  roles: Partial<IRole>[];
}) {
  const [formData, setFormData] = useState<Partial<ISiteItem>>({
    name: initialData.name || '',
    title: initialData.title || '',
    url: initialData.url || '',
    parentId: initialData.parentId,
    isRoot: initialData.isRoot || false,
    seotag: initialData.seotag || '',
    html: initialData.html || '',
    roleIds: initialData.roleIds || [],
    type: initialData.type! || 'static',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

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
      <div>
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
            onChange={(e) => setFormData({ ...formData, parentId: e as string })}
          />

          <S3Autocomplete
            value={formData.roleIds!}
            onChange={(value) => setFormData({ ...formData, roleIds: value as string[] })}
            options={roles.map((role) => ({
              id: role.id!,
              name: role.name!,
            })) || []}
            multiple
            label="Роли"
          />
          <TextField
            label="Тип"
            fullWidth
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as SiteItemType })}
            select
            variant="standard"
          >
            {Object.values(SiteItemType).map((type) => (
              <MenuItem key={type} value={type}>
                {siteItemTypeNames[type]}
              </MenuItem>
            ))}
          </TextField>
        </div>
      </div>
      <hr style={{
        margin: '16px 0px',
        borderTopWidth: 4,
      }}
      />
      <h4>Содержимое страницы</h4>
      <BlockEditor
        initialData={initialData.blockContent}
        onChange={(blockContent) => setFormData({ ...formData, blockContent })}
      />
      {/* <h4>Контент</h4>
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
      </div> */}

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
