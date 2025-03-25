import {
  gql, useMutation, useQuery,
} from '@apollo/client';
import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';
import { MaterialReactTable, MRT_ColumnDef } from 'material-react-table';
import TableEditor from '@/components/table-editor';
import { IconButton, MenuItem, TextField } from '@mui/material';
import { IRole } from '@/components/entities/IRole';
import { Edit, Save } from '@mui/icons-material';
import Link from 'next/link';

function AccountsPage() {
  const router = useRouter();
  const { loading, data, refetch } = useQuery(gql`
    query {
      getUsers {
        id
        name
        role {
          id
          name
        }
        email
      }
      getRoles {
        id
        name
      }
    }
  `);

  const [changeUserRole] = useMutation(gql`
    mutation changeUserRole($id: ID!, $roleId: ID!) {
      changeUserRole(id: $id, roleId: $roleId)
    }
  `);

  const columns: MRT_ColumnDef<any, any>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 400,
      },
      {
        accessorKey: 'name',
        header: 'Имя',
        size: 150,
        Cell: ({ row }) => (
          <div>
            {row.original.name}
            <Link href={`/admin/accounts/${row.original.id}`}>
              <IconButton size="small">
                <Edit />
              </IconButton>
            </Link>
          </div>
        ),
      },
      {
        accessorKey: 'role.name',
        header: 'Роль',
        size: 150,
        Cell: ({ row }) => {
          const [roleId, setRoleId] = useState(row.original.role.id);
          if (!data.getRoles) {
            return null;
          }
          return (
            <>
              <TextField
                select
                variant="standard"
                value={roleId}
                onChange={(e) => {
                  setRoleId(e.target.value);
                }}
              >
                {data.getRoles.map((role: IRole) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </TextField>
              {row.original.role.id !== roleId && (
              <IconButton
                onClick={async () => {
                  await changeUserRole({
                    variables: {
                      id: row.original.id,
                      roleId,
                    },
                  });
                  refetch();
                }}
              >
                <Save />
              </IconButton>
              )}
            </>
          );
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 150,
      },
    ],
    [router, data],
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
        data={data.getUsers}
        enableColumnResizing
        enableFullScreenToggle={false}
        enableDensityToggle
        enableColumnFilters
        enablePagination
        enableSorting
        initialState={{
          columnVisibility: {
            id: false,
          },
        }}
        muiTableProps={{
          sx: {
            tableLayout: 'fixed',
          },
        }}
        renderTopToolbarCustomActions={() => (
          <div className="px-4 py-2">
            <h1 className="text-xl font-bold">Аккаунты</h1>
          </div>
        )}
      />
    </div>
  );
}

export default AccountsPage;
