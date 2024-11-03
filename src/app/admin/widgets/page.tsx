'use client';

import { gql, useQuery } from '@apollo/client';
import { Button, CircularProgress, Typography } from '@mui/material';

function WidgetsWidget(props) {
  const { data, loading } = useQuery(gql`
      query {
        getAllWidgets {
          id
          name
          title
          createdAt
        }
      }
  `);
  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <div className="flex items-center gap-4">
        <Typography variant="h4">Виджеты</Typography>
        <Button
          variant="contained"
          onClick={() => {
            // setSelectedWidget(null);
            // setIsFormOpen(true);
          }}
        >
          Добавить виджет
        </Button>
      </div>

      {/* <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 p-4">
        {data?.getAllSiteItems?.map((widget: ISiteItem) => (
          <WidgetCard
            key={widget.id}
            widget={widget}
            onEdit={(widget) => {
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
          {selectedWidget ? "Редактировать страницу" : "Создать новую страницу"}
        </DialogTitle>
        <DialogContent>
          <WidgetForm
            initialData={selectedWidget || {}}
            onSubmit={selectedWidget ? handleUpdate : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedWidget(null);
            }}
          />
        </DialogContent>
      </Dialog> */}
    </div>
  );
}

export default WidgetsWidget;
