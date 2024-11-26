import {
  gql, useApolloClient, useMutation, useQuery,
} from '@apollo/client';
import { AddOutlined, Delete, DeleteOutlined } from '@mui/icons-material';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';
import { MaterialReactTable } from 'material-react-table';
import TableEditor from '@/components/table-editor';

const CREATE_TABLE = gql`
  mutation CreateTable($input: TableInput!) {
    createTable(input: $input) {
      id
      name
      dbName
      fields {
        id
        name
        dbName
        type
      }
      createdAt
    }
  }
`;

function TablesPage(props) {
  const router = useRouter();
  const { loading, data, refetch } = useQuery(gql`
    query {
      getTables {
        id
        name
        dbName
        createdAt
      }
    }
  `);

  const columns = useMemo(
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
        Cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/admin/tables/${row.original.id}`)}
            >
              Просмотр
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <div className="mb-4">
        <Button
          variant="contained"
          onClick={() => setIsModalOpen(true)}
          className="mb-4 normal-case"
        >
          Добавить таблицу
        </Button>
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
        data={data.getTables}
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
    </div>
  );
}

export default TablesPage;
