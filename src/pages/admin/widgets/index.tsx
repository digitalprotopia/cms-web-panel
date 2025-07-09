import dayjs from 'dayjs';
import Link from 'next/link';
import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Edit, AccessTime, Delete,
} from '@mui/icons-material';
import {
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  CircularProgress,
} from '@mui/material';

import { IWidget } from '@/components/entities/IWidget';
import WidgetEdit from '@/components/WidgetEdit';

const GET_WIDGETS = gql`
  query GetAllWidgets {
    getAllWidgets {
      id
      name
      title
      createdAt
      tableView {
        id
        tableId
      }
    }
  }
`;

const DELETE_WIDGET = gql`
  mutation DeleteWidget($id: ID!) {
    deleteWidget(id: $id)
  }
`;

function WidgetCard({
  widget,
  onDelete,
}: {
  widget: IWidget;
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between p-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-medium scrollable-title">{widget.title}</h2>
        </div>
        <div className="flex-shrink-0 flex gap-2 ml-4">
          <Link href={`/admin/widgets/${widget.id}`}>
            <IconButton size="small">
              <Edit />
            </IconButton>
          </Link>
          <IconButton
            onClick={() => onDelete(widget.id)}
            size="small"
            color="error"
          >
            <Delete />
          </IconButton>
        </div>
      </div>
      <CardContent>
        <Typography variant="body2" color="text.secondary" className="scrollable-title">
          Код:
          {' '}
          {widget.name}
        </Typography>
        <div className="flex items-center mt-2">
          <AccessTime sx={{ fontSize: 16, marginRight: '4px' }} />
          <Typography variant="caption" color="text.secondary">
            Создано:
            {' '}
            {dayjs(widget.createdAt).format('DD.MM.YYYY')}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}

function WidgetsPage() {
  // todo: Рассмотреть возможность удаления isModalOpen state и соответсвующего Dialog в return.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(GET_WIDGETS);

  const [deleteWidget] = useMutation(DELETE_WIDGET, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error('Ошибка при удалении виджета:', error);
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот виджет?')) {
      deleteWidget({ variables: { id } });
    }
  };

  const handleCloseModal = () => {
    setSelectedWidgetId(null);
    setIsModalOpen(false);
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
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullScreen
      >
        <DialogTitle>
          {selectedWidgetId ? 'Редактировать виджет' : 'Создать новый виджет'}
        </DialogTitle>
        <DialogContent>
          <WidgetEdit id={selectedWidgetId as string} onClose={handleCloseModal} />
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between gap-4">
        <Typography variant="h4">Виджеты</Typography>
        <Link href="/admin/widgets/add">
          <Button
            variant="contained"
          >
            Добавить виджет
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 p-4">
        {data?.getAllWidgets?.map((widget: IWidget) => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default WidgetsPage;
