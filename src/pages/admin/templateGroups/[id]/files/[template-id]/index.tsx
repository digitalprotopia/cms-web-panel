import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Typography,
  CircularProgress,
  Icon,
  Grid2,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  MenuItem,
} from '@mui/material';

import { ITemplate, TemplateType } from '@/components/entities/ITemplate';
import {
  useRouter,
} from 'next/router';
import TemplateEdit from '@/components/TemplateEdit';
import clsx from 'clsx';
import { useSearchParams } from 'next/navigation';
import { Add, Delete } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import TemplateGroupMenu from '@/components/blocks/templates/TemplateGroupMenu';

const GET_TEMPLATES = gql`
  query GetTemplateGroup($id: ID!) {
    getTemplateGroup(id: $id) {
      id
      title
      templates {
        id
        name
        title
        html
        blockContent
        file {
          id
          name
          extension
          size
        }
        templateGroupId
        type
        createdAt
        updatedAt
      }
    }
  }
`;

const GET_TEMPLATE = gql`
  query GetTemplate($id: ID!) {
    getTemplate(id: $id) {
      id
      name
      title
      html
      blockContent
      type
      templateGroupId
      createdAt
      updatedAt
    }
  }
`;

const CREATE_TEMPLATE = gql`
  mutation CreateTemplate($input: TemplateInput!) {
    createTemplate(input: $input) {
      id
      html
    }
  }
`;

const UPDATE_TEMPLATE = gql`
  mutation UpdateTemplate($id: ID!, $input: TemplateInput!) {
    editTemplate(id: $id, input: $input) {
      name
      title
      templateGroupId
      html
      createdAt
      updatedAt
    }
  }
`;

const DELETE_TEMPLATE = gql`
  mutation DeleteTemplate($id: ID!) {
    deleteTemplate(id: $id)
  }
`;

interface ISidebarItem {
  label: string;
  id: string;
  onClick: () => void;
  onDelete: () => void;
}

interface MenuItemProps extends ISidebarItem {
  isActive: boolean;
}

function SidebarItem({
  label, isActive, onClick, onDelete,
}: MenuItemProps) {
  return (
    <li
      className={clsx(
        'rounded-md p-2 flex justify-between',
        isActive ? 'bg-cms-primary' : 'bg-cms-gray-light',
      )}
    >
      <div
        onClick={onClick}
        className={clsx(
          'flex items-center',
          isActive ? 'text-white' : 'text-cms-gray-dark',
        )}
      >
        <Icon />
        <span className="ml-2">{label}</span>
      </div>
      <div>
        <IconButton onClick={() => onDelete()}>
          <Delete />
        </IconButton>
      </div>
    </li>
  );
}

interface TemplateNavigationProps {
  items: ISidebarItem[];
  currentId: string;
}

function TemplateNavigation({ items, currentId }: TemplateNavigationProps) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <SidebarItem
          key={item.id}
          {...item}
          isActive={currentId === item.id}
        />
      ))}
    </ul>
  );
}

function CreateTemplate(props: {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: ITemplate) => void;
}) {
  const [form, setForm] = useState<Partial<ITemplate>>({
    name: '',
    title: '',
    type: TemplateType.TEXT,
  });
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>Создать файл</DialogTitle>
      <DialogContent>
        <div>
          <TextField
            label="Тип"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as TemplateType })}
            select
          >
            <MenuItem value={TemplateType.TEXT}>Текст</MenuItem>
            <MenuItem value={TemplateType.FILE}>Файл</MenuItem>
          </TextField>
        </div>
        <div>
          <TextField
            label="Название"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <TextField
            label="Имя файла"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Отмена</Button>
        <Button
          onClick={() => {
            props.onSubmit(form as ITemplate);
            props.onClose();
          }}
        >
          Создать
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TemplateFilePage() {
  const router = useRouter();
  const templateId = router.query['template-id'] as string;
  // TODO: investigate, why this is called many times:
  // alert('many times');

  // TODO: id can be null, but the hook can't be called conditionally. Error is generated.
  const resultGetTemplate = useQuery(
    GET_TEMPLATE,
    {
      variables: { id: templateId },
      onCompleted: (_data) => {
        console.log('_data', _data);

        // console.log('selectedTemplate', selectedTemplate);
      },
      onError(error) {
        console.log('Ошибка при получении файла:', error);
      },
    },
  );
  const tLoading = resultGetTemplate.loading;
  // const refetch_template = resultGetTemplate.refetch;

  const templateGroupId = router.query.id;

  const { data, loading, refetch } = useQuery(GET_TEMPLATES, {
    variables: { id: templateGroupId },
  });

  const selectedTemplate = data?.getTemplateGroup?.templates.find(
    (t: ITemplate) => t.id === templateId,
  );

  const [createTemplate] = useMutation(CREATE_TEMPLATE, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при создании файла:', error);
    },
  });

  const [updateTemplate] = useMutation(UPDATE_TEMPLATE, {
    onCompleted: () => {
      // setSelectedTemplate(null); // todo: вывести сообщение вместо очистки
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при обновлении файла:', error);
    },
  });

  const [createDialog, setCreateDialog] = useState(false);

  const [deleteTemplate] = useMutation(DELETE_TEMPLATE, {

    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при удалении файла:', error);
    },
  });

  const { enqueueSnackbar } = useSnackbar();

  const handleCreate = (formData: ITemplate) => {
    createTemplate({
      variables: {
        input: {
          ...formData,
          templateGroupId,
        },
      },
    });
  };

  const handleUpdate = async (formData: Partial<ITemplate>) => {
    if (!templateId) return;
    await updateTemplate({
      variables: {
        id: templateId,
        input: formData,
      },
    });
    refetch();
    enqueueSnackbar('Файл обновлен', { variant: 'success' });
  };

  if (loading || tLoading) {
    return (
      <div className="flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }
  const templates: ITemplate[] = data?.getTemplateGroup?.templates
    .filter((t: ITemplate) => t.name !== 'layout' && t.name !== 'head');

  if (!templates || !templates[0]) {
    throw new Error('У шаблона отсутсвуют файлы.');
  }
  if (!selectedTemplate && templates[0]) {
    router.push(`/admin/templateGroups/${templateGroupId}/files/${templates[0].id}`);
    return (
      <div className="flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <div>
        <TemplateGroupMenu />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Typography variant="h4">Редактирование файлов</Typography>
      </div>
      <Grid2 container spacing={2}>
        <Grid2 size={9}>
          {selectedTemplate && (<TemplateEdit
            key={templateId}
            initialData={selectedTemplate}
            onSubmit={handleUpdate}
            templates={templates}
          />)}
        </Grid2>

        <Grid2 className="p-4" size={3}>
          <TemplateNavigation
            key={templateGroupId as string}
            currentId={templateId}
            items={[
              // todo: use getByValues
              ...(templates.map((t: ITemplate) => ({
                label: t.name,
                id: t.id,
                onClick: () => {
                  router.push(`/admin/templateGroups/${templateGroupId}/files/${t.id}`);
                },
                onDelete: () => {
                  if (window.confirm('Вы уверены, что хотите удалить этот шаблон?')) {
                    if (t.id === templateId) {
                      router.push(`/admin/templateGroups/${templateGroupId}/files/${templates[0].id}`);
                    }
                    deleteTemplate({ variables: { id: t.id } });
                  }
                },
              })) || []),
            ]}
          />
          <IconButton onClick={() => setCreateDialog(true)}>
            <Add />
          </IconButton>
        </Grid2>
      </Grid2>
      <CreateTemplate
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}

export default TemplateFilePage;
