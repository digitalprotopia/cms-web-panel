import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Edit, AccessTime, Delete,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { ITemplateGroup } from '@/components/entities/ITemplateGroup';
import textField from '@/components/guiElements/TextField';
import { useRouter } from 'next/router';

export const GET_TEMPLATE_GROUPS = gql`
  query GetTemplateGroups {
    getTemplateGroups {
      id
      name
      title
      createdAt
      updatedAt
    }
  }
`;

const CREATE_TEMPLATE_GROUP = gql`
  mutation CreateTemplateGroup($input: TemplateGroupInput!) {
    createTemplateGroup(input: $input) {
      id
      name
      title
    }
  }
`;

const UPDATE_TEMPLATE_GROUP = gql`
  mutation UpdateTemplateGroup($id: ID!, $input: TemplateGroupInput!) {
    editTemplateGroup(id: $id, input: $input) {
      id
      name
      title
      createdAt
      updatedAt
    }
  }
`;

const DELETE_TEMPLATE_GROUP = gql`
  mutation DeleteTemplateGroup($id: ID!) {
    deleteTemplateGroup(id: $id)
  }
`;

interface TemplateGroupFormData {
  id?: string;
  name?: string;
  title: string;
}

function TemplateGroupForm({
  initialData = {},
  onSubmit,
  onCancel,
}: {
  initialData: Partial<TemplateGroupFormData>;
  onSubmit: (data: TemplateGroupFormData) => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const {
    id = '', name = '', title = '',
  } = initialData;
  const [formData, setFormData] = useState<TemplateGroupFormData>({
    id, name, title,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="grid grid-cols-2 gap-4">
        {textField('Код', formData.name, (e) => setFormData({ ...formData, name: e.target.value }))}
        {textField('Заголовок', formData.title, (e) => setFormData({ ...formData, title: e.target.value }))}
      </div>

      <div className="flex justify-end gap-2 mt-5">
        <Button hidden={!initialData.id} variant="outlined" onClick={() => router.push(`/admin/templateGroups/${id}`)}>
          Шаблоны
        </Button>
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

function TemplateGroupCard({
  templateGroup,
  onEdit,
  onDelete,
}: {
  templateGroup: ITemplateGroup;
  onEdit: (templateGroup: ITemplateGroup) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  return (
    <Card onClick={() => router.push(`/admin/templateGroups/${templateGroup.id}`)}>
      <CardHeader
        title={templateGroup.title}
        action={(
          <div>
            <IconButton onClick={() => onEdit(templateGroup)} size="small">
              <Edit />
            </IconButton>
            <IconButton
              onClick={() => onDelete(templateGroup.id)}
              size="small"
              color="error"
            >
              <Delete />
            </IconButton>
          </div>
        )}
      />
      <CardContent>
        <div className="flex items-center">
          <AccessTime sx={{ fontSize: 16, marginRight: '4px' }} />
          <Typography variant="caption" color="text.secondary">
            {dayjs(parseInt(String(templateGroup.createdAt), 10)).toString()}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateGroupsPage() {
  const [selectedTemplateGroup, setSelectedTemplateGroup] = useState<ITemplateGroup | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, loading, refetch } = useQuery(GET_TEMPLATE_GROUPS);

  const [createTemplateGroup] = useMutation(CREATE_TEMPLATE_GROUP, {
    onCompleted: () => {
      setIsFormOpen(false);
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при создании группы шаблонов:', error);
    },
  });

  const [updateTemplateGroup] = useMutation(UPDATE_TEMPLATE_GROUP, {
    onCompleted: () => {
      setIsFormOpen(false);
      setSelectedTemplateGroup(null);
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при обновлении группы шаблонов:', error);
    },
  });

  const [deleteTemplateGroup] = useMutation(DELETE_TEMPLATE_GROUP, {

    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при удалении группы шаблонов:', error);
    },
  });

  const handleCreate = (formData: TemplateGroupFormData) => {
    const { id, ...inputData } = formData;
    createTemplateGroup({ variables: { input: inputData } });
  };

  const handleUpdate = (formData: TemplateGroupFormData) => {
    if (!selectedTemplateGroup) return;
    updateTemplateGroup({
      variables: {
        id: selectedTemplateGroup.id,
        input: formData,
      },
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот группу шаблонов?')) {
      deleteTemplateGroup({ variables: { id } });
    }
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
      <div className="flex items-center justify-between gap-4">
        <Typography variant="h4">Шаблоны сайта</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setSelectedTemplateGroup(null);
            setIsFormOpen(true);
          }}
        >
          Добавить группу шаблонов
        </Button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 p-4">
        {data?.getTemplateGroups?.map((templateGroup: ITemplateGroup) => (
          <TemplateGroupCard
            key={templateGroup.id}
            templateGroup={templateGroup}
            onEdit={(editedTemplateGroup) => {
              setSelectedTemplateGroup(editedTemplateGroup);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <Dialog
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedTemplateGroup(null);
        }}
        maxWidth="md"
        fullScreen
      >
        <DialogTitle>
          {selectedTemplateGroup ? 'Редактировать группу шаблонов' : 'Создать новую группу шаблонов'}
        </DialogTitle>
        <DialogContent>
          <TemplateGroupForm
            initialData={selectedTemplateGroup || {}}
            onSubmit={selectedTemplateGroup ? handleUpdate : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedTemplateGroup(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TemplateGroupsPage;
