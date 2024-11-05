"use client";

import React, { useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import { Edit, AccessTime, Delete, Visibility } from "@mui/icons-material";
import dayjs from "dayjs";
import Link from "next/link";
import { IWidget } from "@/components/entities/IWidget";
import WidgetEdit from "@/components/WidgetEdit";

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
  onEdit,
  onDelete,
}: {
  widget: IWidget;
  onEdit: (widget: IWidget) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader
        title={widget.title}
        action={
          <div>
            <IconButton onClick={() => onEdit(widget)} size="small">
              <Edit />
            </IconButton>
            <IconButton
              onClick={() => onDelete(widget.id)}
              size="small"
              color="error"
            >
              <Delete />
            </IconButton>
          </div>
        }
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {widget.name}
        </Typography>
        <div className="flex items-center mt-2">
          <AccessTime sx={{ fontSize: 16, marginRight: "4px" }} />
          <Typography variant="caption" color="text.secondary">
            {dayjs(parseInt(widget.createdAt)).toString()}
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}

function WidgetsPage() {
  const [selectedWidget, setSelectedWidget] = useState<IWidget | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(GET_WIDGETS);

  const [deleteWidget] = useMutation(DELETE_WIDGET, {
    onCompleted: () => {
      refetch();
    },
    onError: (error) => {
      console.error("Ошибка при удалении виджета:", error);
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Вы уверены, что хотите удалить этот виджет?")) {
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
        fullWidth
      >
        <DialogTitle>
          {selectedWidgetId ? "Редактировать виджет" : "Создать новый виджет"}
        </DialogTitle>
        <DialogContent>
          <WidgetEdit id={selectedWidgetId} onClose={handleCloseModal} />
        </DialogContent>
      </Dialog>
      <div className="flex items-center justify-between gap-4">
        <Typography variant="h4">Виджеты</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setSelectedWidget(null);
            setIsFormOpen(true);
          }}
        >
          Добавить виджет
        </Button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 p-4">
        {data?.getAllWidgets?.map((widget: IWidget) => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            onEdit={(widget) => {
              console.log(widget);
              setSelectedWidget(widget);
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
          setSelectedWidget(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedWidget ? "Редактировать виджет" : "Создать новый виджет"}
        </DialogTitle>
        <DialogContent>
          <WidgetEdit
            id={selectedWidget?.id}
            tableId={selectedWidget?.tableView?.tableId}
            onClose={() => {
              setIsFormOpen(false);
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WidgetsPage;
