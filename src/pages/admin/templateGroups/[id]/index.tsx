import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Typography,
  CircularProgress,
  Icon,
  Grid2,
} from '@mui/material';

import { ITemplate, ITemplateFormData } from '@/components/entities/ITemplate';
import {
  useRouter,
} from 'next/router';
import TemplateEdit from '@/components/TemplateEdit';
import clsx from 'clsx';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const GET_TEMPLATES = gql`
  query GetTemplates {
    getTemplates {
      id
      name
      title
      html
      templateGroupId
      createdAt
      updatedAt
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
      templateGroupId
      createdAt
      updatedAt
    }
  }
`;

// const CREATE_TEMPLATE = gql`
//   mutation CreateTemplate($input: TemplateInput!) {
//     createTemplate(input: $input) {
//       id
//       html
//     }
//   }
// `;

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

// const DELETE_TEMPLATE = gql`
//   mutation DeleteTemplate($id: ID!) {
//     deleteTemplate(id: $id)
//   }
// `;

interface ISidebarItem {
  label: string;
  href: string;
  onClick: () => void;
}

interface MenuItemProps extends ISidebarItem {
  isActive: boolean;
}

function SidebarItem({
  href, label, isActive, onClick,
}: MenuItemProps) {
  return (
    <li
      className={clsx(
        'rounded-md p-2',
        isActive ? 'bg-cms-primary' : 'bg-cms-gray-light',
      )}
    >
      <Link
        href={href}
        onClick={onClick}
        className={clsx(
          'flex items-center',
          isActive ? 'text-white' : 'text-cms-gray-dark',
        )}
      >
        <Icon />
        <span className="ml-2">{label}</span>
      </Link>
    </li>
  );
}

interface TemplateNavigationProps {
  items: ISidebarItem[];
}

function TemplateNavigation({ items }: TemplateNavigationProps) {
  const router = useRouter();
  const currentId = router.query.id;

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <SidebarItem
          key={item.href}
          {...item}
          isActive={currentId === item.href.split('?').pop()}
        />
      ))}
    </ul>
  );
}

function TemplatesPage() {
  const router = useRouter();
  const currentPath = router.asPath;
  const templateId = useSearchParams().get('templateId');
  // TODO: investigate, why this is called many times:
  // alert('many times');
  const [selectedTemplate, setSelectedTemplate] = useState<ITemplate | null>(null);

  // TODO: id can be null, but the hook can't be called conditionally. Error is generated.
  const resultGetTemplate = useQuery(
    GET_TEMPLATE,
    {
      variables: { id: templateId },
      onCompleted: (_data) => {
        console.log('_data', _data);

        setSelectedTemplate(_data.getTemplate);

        console.log('selectedTemplate', selectedTemplate);
      },
      onError(error) {
        console.log('Ошибка при получении шаблона:', error);
      },
    },
  );
  const tLoading = resultGetTemplate.loading;
  // const refetch_template = resultGetTemplate.refetch;

  const templateGroupId = router.query.id;

  const { data, loading, refetch } = useQuery(GET_TEMPLATES);

  // const [createTemplate] = useMutation(CREATE_TEMPLATE, {
  //   onCompleted: () => {
  //     refetch();
  //   },
  //   onError: (error) => {
  //     console.error('Ошибка при создании шаблона:', error);
  //   },
  // });

  const [updateTemplate] = useMutation(UPDATE_TEMPLATE, {
    onCompleted: () => {
      setSelectedTemplate(null); // todo: вывести сообщение вместо очистки
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при обновлении шаблона:', error);
    },
  });

  // const [deleteTemplate] = useMutation(DELETE_TEMPLATE, {

  //   onCompleted: () => {
  //     refetch();
  //   },
  //   onError: (error) => {
  //     console.error('Ошибка при удалении шаблона:', error);
  //   },
  // });

  // const handleCreate = (formData: TemplateFormData) => {
  //   createTemplate({ variables: { input: formData } });
  // };

  const handleUpdate = (formData: ITemplateFormData) => {
    if (!selectedTemplate) return;
    updateTemplate({
      variables: {
        id: selectedTemplate.id,
        input: formData,
      },
    });
  };

  if (loading || tLoading) {
    return (
      <div className="flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }
  const templates: ITemplate[] = data?.getTemplates?.filter(
    (t: ITemplate) => (templateGroupId
      ? t.templateGroupId === templateGroupId
      : true),
  );
  if (!templates || !templates[0]) {
    throw new Error('У группы отсутсвуют шаблоны.');
  }
  if (!selectedTemplate) {
    setSelectedTemplate(templates[0]);
    return (
      <div className="flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <div className="flex items-center justify-between gap-4">
        <Typography variant="h4">Редактирование шаблонов</Typography>
      </div>
      <Grid2 container spacing={2}>
        <Grid2 size={9}>
          <TemplateEdit
            key={selectedTemplate.id}
            initialData={selectedTemplate}
            onSubmit={handleUpdate}
          />
        </Grid2>

        <Grid2 className="p-4" size={3}>
          <TemplateNavigation
            key={templateGroupId}
            items={[
              // todo: use getByValues
              ...(templates.map((t: ITemplate) => ({
                label: t.name,
                href: `${currentPath}?templateId=${t.id}`,
                id: t.id,
                onClick: () => { setSelectedTemplate(t); },
              })) || []),
            ]}
          />
        </Grid2>
      </Grid2>
    </div>
  );
}

export default TemplatesPage;
