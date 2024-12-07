import {
  gql, useQuery,
} from '@apollo/client';
import { useRouter } from 'next/router';
import { useState, useMemo, useEffect } from 'react';
import { MaterialReactTable, MRT_ColumnDef } from 'material-react-table';
import TableEditor from '@/components/table-editor';
import {
  Dialog, DialogContent, IconButton, TextField,
} from '@mui/material';
import { IRole } from '@/components/entities/IRole';
import { Edit } from '@mui/icons-material';

function EditRole(props: {
  role?: IRole;
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<IRole>>({
    name: '',
    title: '',
  });
  useEffect(() => {
    setForm(props.role ? {
      name: props.role.name,
      title: props.role.title,
    } : {
      name: '',
      title: '',
    });
  }, [props.open]);
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogContent>
        <TextField
          variant="standard"
          fullWidth
          label="Название"
          value={form.title}
          onChange={(e) => {
            setForm({
              ...form,
              title: e.target.value,
            });
          }}
        />
        <TextField
          variant="standard"
          fullWidth
          label="Техническое название"
          value={form.name}
          onChange={(e) => {
            setForm({
              ...form,
              name: e.target.value,
            });
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function RolesPage() {
  const router = useRouter();
  const { loading, data, refetch } = useQuery(gql`
    query {
      getRoles {
        id
        name
        title
      }
    }
  `);

  const [editDialogId, setEditDialogId] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const columns: MRT_ColumnDef<any, any>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 400,
      },
      {
        accessorKey: 'name',
        header: 'Техническое название',
        size: 150,
      },
      {
        accessorKey: 'title',
        header: 'Название',
        size: 150,
      },
      {
        accessorKey: 'id-2',
        header: '',
        Cell: ({ row }) => (
          <IconButton
            onClick={() => {
              setEditDialogId(row.index);
              setEditDialogOpen(true);
            }}
          >
            <Edit />
          </IconButton>
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
        data={data.getRoles}
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
            <h1 className="text-xl font-bold">Роли</h1>
          </div>
        )}
      />
      <EditRole
        role={data.getRoles[editDialogId!]}
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
        }}
      />
    </div>
  );
}

export default RolesPage;
