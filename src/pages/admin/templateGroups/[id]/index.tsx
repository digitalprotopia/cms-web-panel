import React from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Typography,
  CircularProgress,
} from '@mui/material';

import { ITemplate } from '@/components/entities/ITemplate';
import {
  useRouter,
} from 'next/router';
import TemplateEdit from '@/components/TemplateEdit';
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

function TemplatesPage() {
  const router = useRouter();

  const templateGroupId = router.query.id;

  const { enqueueSnackbar } = useSnackbar();

  const { data, loading, refetch } = useQuery(GET_TEMPLATES, {
    variables: { id: templateGroupId },
  });

  const selectedTemplate = data?.getTemplateGroup?.templates.find(
    (t: ITemplate) => t.name === 'layout',
  );

  const templates = data?.getTemplateGroup?.templates || [];

  const [updateTemplate] = useMutation(UPDATE_TEMPLATE, {
    onCompleted: () => {
      // setSelectedTemplate(null); // todo: вывести сообщение вместо очистки
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при обновлении файла:', error);
    },
  });

  const handleUpdate = async (formData: Partial<ITemplate>) => {
    if (!selectedTemplate.id) return;
    await updateTemplate({
      variables: {
        id: selectedTemplate.id,
        input: formData,
      },
    });
    refetch();
    enqueueSnackbar('Файл обновлен', { variant: 'success' });
  };

  if (loading) {
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
        <Typography variant="h4">Редактирование шаблона сайта</Typography>
      </div>
      <TemplateEdit
        initialData={selectedTemplate}
        onSubmit={handleUpdate}
        templates={templates}
        isSystem
      />
    </div>
  );
}

export default TemplatesPage;
