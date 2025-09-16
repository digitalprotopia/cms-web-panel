import S3Autocomplete from '@/components/guiElements/S3Autocomplete';
import { useState } from 'react';
import {
  Button, Checkbox, CircularProgress, FormControlLabel, MenuItem, TextField,
} from '@mui/material';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { ISiteItem, SiteItemType, siteItemTypeNames } from '../entities/ISiteItem';
import { IRole } from '../entities/IRole';
import BlockEditor from '../BlockEditor';

const CREATE_PAGE = gql`
  mutation CreateSiteItem($input: SiteItemInput!) {
    createSiteItem(input: $input) {
      id
      name
      title
      url
      parentId
      isRoot
      is404
      seotag
      html
      blockContent
      type
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_PAGE = gql`
  mutation UpdateSiteItem($id: ID!, $input: SiteItemInput!) {
    editSiteItem(id: $id, input: $input) {
      id
      name
      title
      url
      parentId
      isRoot
      is404
      seotag
      html
      blockContent
      type
      createdAt
      updatedAt
    }
  }
`;

export const GET_SITE_PAGES = gql`
  query ($id: ID!) {
    getRoles {
      id
      name
    }
    getSite(id: $id) {
      id
      title
      siteItems {
        id
        name
        title
        url
        parentId
        isRoot
        is404
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
  }
`;

export default function PageForm({
  id,
  onClose,
}: {
  id?: string;
  onClose: () => void;
}) {
  const [createPage] = useMutation(CREATE_PAGE, {
    onError: (error) => {
      console.error('Ошибка при создании страницы:', error);
    },
  });

  const [updatePage] = useMutation(UPDATE_PAGE, {
    onError: (error) => {
      console.error('Ошибка при обновлении страницы:', error);
    },
  });

  const handleCreate = async (formData: Partial<ISiteItem>) => {
    await createPage({ variables: { input: formData } });
    onClose();
  };

  const handleUpdate = async (formData: Partial<ISiteItem>) => {
    await updatePage({
      variables: {
        id,
        input: formData,
      },
    });
    onClose();
  };

  const router = useRouter();

  const [formData, setFormData] = useState<Partial<ISiteItem>>({
    siteId: router.query['site-id'] as string,
    name: '',
    title: '',
    url: '',
    parentId: undefined,
    isRoot: false,
    is404: false,
    seotag: '',
    html: '',
    roleIds: [],
    type: SiteItemType.STATIC,
  });

  const initialData = useQuery(gql`
    query ($id: ID!) {
      getSiteItem(id: $id) {
        id
        name
        title
        url
        parentId
        isRoot
        is404
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
  `, {
    variables: { id },
    skip: !id,
    onCompleted: (data) => {
      setFormData({
        name: data.getSiteItem.name,
        title: data.getSiteItem.title,
        url: data.getSiteItem.url,
        parentId: data.getSiteItem.parentId,
        isRoot: data.getSiteItem.isRoot,
        is404: data.getSiteItem.is404,
        seotag: data.getSiteItem.seotag,
        html: data.getSiteItem.html,
        roleIds: data.getSiteItem.roles.map((role: IRole) => role.id),
        type: data.getSiteItem.type,
        blockContent: data.getSiteItem.blockContent,
      });
    },
  });

  const roles = useQuery(gql`
    query {
      getRoles {
        id
        name
      }
    }
  `);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (id) {
      handleUpdate(formData);
    } else {
      handleCreate(formData);
    }
  };

  const { data: pagesData, loading } = useQuery(GET_SITE_PAGES, {
    variables: {
      id: router.query['site-id'] as string,
    },
  });

  if (loading || !roles.data || (id && !initialData.data?.getSiteItem?.id)) {
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
            slotProps={{
              htmlInput: { maxLength: 255 },
            }}
          />
          <TextField
            label="SEO Тег"
            fullWidth
            value={formData.seotag}
            onChange={(e) => setFormData({ ...formData, seotag: e.target.value })}
            slotProps={{
              htmlInput: { maxLength: 255 },
            }}
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
            options={pagesData?.getSite.siteItems || []}
            getOptionLabelFromKey="title"
            onChange={(e) => setFormData({ ...formData, parentId: e as string })}
          />

          <S3Autocomplete
            value={formData.roleIds!}
            onChange={(value) => setFormData({ ...formData, roleIds: value as string[] })}
            options={roles.data.getRoles.map((role: IRole) => ({
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
          <FormControlLabel
            control={(<Checkbox
              checked={formData.is404}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  is404: e.target.checked,
                });
              }}
            />)}
            label="Страница 404"
          />
        </div>
      </div>
      <hr style={{
        margin: '16px 0px',
        borderTopWidth: 4,
      }}
      />
      <h4>Содержимое страницы</h4>
      <BlockEditor
        initialData={initialData.data?.getSiteItem?.blockContent}
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
        <Button variant="outlined" onClick={() => onClose()}>
          Отмена
        </Button>
        <Button variant="contained" type="submit">
          {id ? 'Обновить' : 'Создать'}
        </Button>
      </div>
    </form>
  );
}
