import {
  gql, useMutation, useQuery,
} from '@apollo/client';
// import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';
import { MaterialReactTable, MRT_ColumnDef } from 'material-react-table';
import TableEditor from '@/components/table-editor';
import { Dialog, DialogContent, DialogTitle, IconButton, MenuItem, TextField } from '@mui/material';
import { IRole } from '@/components/entities/IRole';
import { Edit, Save, Delete } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import Link from 'next/link';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

function AccountsPage() {
  const { enqueueSnackbar } = useSnackbar();
  // const router = useRouter();
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

  const [deleteSession] = useMutation(gql`
    mutation DeleteSession($id: ID!) {
      deleteSession(id: $id)
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
    [data, changeUserRole, refetch],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string, name: string } | null>(null);
  const { data: sessionsData, refetch: refetchSessions } = useQuery(gql`
    query GetSessionsByUserId($userId: ID!) {
      getSessionsByUserId(userId: $userId) {
        id
        deviceUserName
        createdAt
      }
    }
  `, {
    variables: { userId: selectedUser?.id },
    skip: !selectedUser?.id,
  });

  dayjs.extend(utc);
  dayjs.extend(timezone);
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
        muiTableBodyRowProps={({ row }) => ({
          onClick: async () => {
            const userRow = row.original as { id: string, name: string };
            setSelectedUser({ id: userRow.id, name: userRow.name });
            setIsSessionsOpen(true);
            setTimeout(() => {
              refetchSessions();
            }, 0);
          },
          sx: { cursor: 'pointer' },
        })}
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

      <Dialog
        open={isSessionsOpen}
        onClose={() => {
          setIsSessionsOpen(false);
          setSelectedUser(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Сессии пользователя
          {selectedUser ? `: ${selectedUser.name}` : ''}
        </DialogTitle>
        <DialogContent>
          <div className="flex flex-col gap-2">
            {(sessionsData?.getSessionsByUserId || []).map((session: any) => (
              <div key={session.id} className="flex justify-between items-center border-b py-2">
                <div className="text-black/80">{session.deviceUserName || '—'}</div>
                <div className="text-black/60">
                  {dayjs.tz(session.createdAt, browserTz).format('DD.MM.YYYY HH:mm:ss')}
                </div>
                <div>
                  <IconButton
                    size="small"
                    onClick={async () => {
                      try {
                        await deleteSession({ variables: { id: session.id } });
                        await refetch();
                        enqueueSnackbar('Сессия удалена', { variant: 'success' });
                      } catch (e: any) {
                        enqueueSnackbar(e.message || 'Не удалось удалить сессию', { variant: 'error' });
                      }
                    }}
                  >
                    <Delete />
                  </IconButton>
                </div>
              </div>
            ))}
            {selectedUser && (!sessionsData || sessionsData.getSessionsByUserId?.length === 0) && (
              <div className="text-black/60 py-4">Нет активных сессий</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AccountsPage;
