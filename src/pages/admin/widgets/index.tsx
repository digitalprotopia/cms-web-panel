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
import { IWidget } from '@/components/entities/IWidget';
import WidgetEdit from '@/components/WidgetEdit';
import Link from 'next/link';

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
      <CardHeader
        title={widget.title}
        action={(
          <div>
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
        )}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {widget.name}
        </Typography>
        <div className="flex items-center mt-2">
          <AccessTime sx={{ fontSize: 16, marginRight: '4px' }} />
          <Typography variant="caption" color="text.secondary">
            {dayjs(widget.createdAt).toString()}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}

function WidgetsPage() {
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
