import {
  gql, useMutation, useQuery,
} from '@apollo/client';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';
import { MaterialReactTable, MRT_ColumnDef, MRT_RowData } from 'material-react-table';
import TableEditor from '@/components/table-editor';
import { ITable } from '@/components/entities/ITable';

function TablesPage() {
  const router = useRouter();
  const { loading, data, refetch } = useQuery(gql`
    query {
      getTables {
        id
        name
        dbName
        isSystem
        createdAt
      }
    }
  `);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState<false | string>(false);
  const [editForm, setEditForm] = useState<Partial<ITable>>({
    name: '',
    dbName: '',
  });

  const [showSystem, setShowSystem] = useState(false);

  const [editTable] = useMutation(gql`
    mutation ($id: ID!, $input: TableInput!) {
      updateTable(id: $id, input: $input) {
        id
        name
      }
    }
  `);

  const columns = useMemo<MRT_ColumnDef<MRT_RowData>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 400,
      },
      {
        accessorKey: 'dbName',
        header: 'DB Name',
        size: 150,
        Cell: ({ row }) => (
          <div>
            <div>
              {row.original.dbName}
            </div>
            {row.original.isSystem && <div className="text-red-600">Системная таблица</div>}
          </div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Имя',
        size: 150,
      },
      {
        accessorKey: 'actions',
        header: 'Действия',
        size: 300,
        Cell: ({ row }: { row: any }) => (
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/admin/tables/${row.original.id}`)}
            >
              Просмотр
            </Button>
            <Button
              onClick={() => router.push(`/admin/tables/${row.original.id}/triggers`)}
            >
              Триггеры
            </Button>

            {/* <Button
              onClick={() => {
                setEditDialogOpen(row.original.id);
                setEditForm({
                  name: row.original.name,
                  dbName: row.original.dbName,
                });
              }}
            >
              Редактировать
            </Button> */}
          </div>
        ),
      },
    ],
    [router],
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  let filteredData = data?.getTables || [];

  if (!showSystem) {
    filteredData = filteredData.filter((table: ITable) => !table.isSystem);
  }

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="contained"
          onClick={() => setIsModalOpen(true)}
          className="normal-case"
        >
          Добавить таблицу
        </Button>
        <FormControlLabel
          control={(<Checkbox
            checked={showSystem}
            onChange={(e) => setShowSystem(e.target.checked)}
          />)}
          label="Показать системные таблицы"
        />
      </div>

      <TableEditor
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsModalOpen(false);
        }}
        mode="create"
      />

      <MaterialReactTable
        columns={columns}
        data={filteredData}
        enableColumnResizing
        enableFullScreenToggle={false}
        enableDensityToggle
        enableColumnFilters
        enablePagination
        enableSorting
        muiTableProps={{
          sx: {
            tableLayout: 'fixed',
          },
        }}
        renderTopToolbarCustomActions={() => (
          <div className="px-4 py-2">
            <h1 className="text-xl font-bold">Таблицы данных</h1>
          </div>
        )}
      />

      <Dialog open={!!editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>
          Редактирование таблицы
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Имя"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <TextField
            label="DB Name"
            value={editForm.dbName}
            onChange={(e) => setEditForm({ ...editForm, dbName: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEditDialogOpen(false)}
          >
            Отмена
          </Button>
          <Button
            onClick={async () => {
              await editTable({
                variables: {
                  id: editDialogOpen,
                  input: editForm,
                },
              });
              refetch();
              setEditDialogOpen(false);
            }}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default TablesPage;
