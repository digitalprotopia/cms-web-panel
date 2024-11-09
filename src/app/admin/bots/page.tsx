'use client';

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
import { useRouter } from 'next/navigation';
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
      getBots {
        name
        title
      }
    }
  `);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Логин бота',
        size: 150,
      },
      {
        accessorKey: 'title',
        header: 'Имя бота',
        size: 150,
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
        data={data.getBots}
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
            <h1 className="text-xl font-bold">Боты</h1>
          </div>
        )}
      />
    </div>
  );
}

export default TablesPage;
