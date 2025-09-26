import {
  gql, useMutation, useQuery,
} from '@apollo/client';
import { useRouter } from 'next/router';
import { useState, useMemo, useEffect } from 'react';
import { MaterialReactTable, MRT_ColumnDef } from 'material-react-table';
import {
  Button,
  Checkbox,
  Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, TextField,
  Tooltip,
} from '@mui/material';
import { IRole } from '@/components/entities/IRole';
import { Delete, Edit, VpnKey } from '@mui/icons-material';
import { PrivilegeType } from '@/components/entities/IPrivilege';
import { useTranslation } from 'react-i18next';

function EditRole(props: {
  role?: IRole;
  open: boolean;
  onClose: () => void;
  refetch: () => void;
}) {
  const [save] = useMutation(props.role?.id
    ? gql`
      mutation($id: ID!, $input: RoleInput!) {
        editRole(id: $id, input: $input) {
          id
        }
      }
    `
    : gql`
      mutation($input: RoleInput!) {
        createRole(input: $input) {
          id
        }
      }
    `);

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
      <DialogActions>
        <Button onClick={props.onClose}>Отмена</Button>
        <Button
          onClick={async () => {
            await save({
              variables: {
                id: props.role?.id,
                input: form,
              },
            });
            props.onClose();
            await props.refetch();
          }}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EditRolePrivileges(props: {
  role: IRole;
  privileges: PrivilegeType[];
  open: boolean;
  onClose: () => void;
  refetch: () => void;
}) {
  const [updatePrivileges] = useMutation(gql`
    mutation ($roleId: String!, $privileges: [PrivilegeInput!]!) {
      updatePrivileges(roleId: $roleId, privileges: $privileges)
    }
  `);

  const [selectedPrivileges, setSelectedPrivileges] = useState<PrivilegeType[]>(props.privileges);

  const { t } = useTranslation();

  if (!props.role) {
    return null;
  }

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogTitle>
        {'Привилегии роли '}
        {props.role.title}
      </DialogTitle>
      <DialogContent>
        {Object.values(PrivilegeType).map((privilege) => (
          <div key={privilege}>
            <FormControlLabel
              control={
                (<Checkbox
                  checked={selectedPrivileges.includes(privilege)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPrivileges([...selectedPrivileges, privilege]);
                    } else {
                      setSelectedPrivileges(selectedPrivileges.filter((p) => p !== privilege));
                    }
                  }}
                />)
}
              label={t(`privilege_${privilege}`)}
            />
          </div>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose}>Отмена</Button>
        <Button
          onClick={async () => {
            await updatePrivileges({
              variables: {
                roleId: props.role.id,
                privileges: selectedPrivileges.map((privilege) => ({ privilege })),
              },
            });
            props.onClose();
            await props.refetch();
          }}
        >
          Сохранить
        </Button>
      </DialogActions>
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
        isSystem
        privileges {
          privilege
        }
      }
    }
  `);

  const [editDialogId, setEditDialogId] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [editPrivilegesDialogId, setEditPrivilegesDialogId] = useState<number | null>(null);
  const [editPrivilegesDialogOpen, setEditPrivilegesDialogOpen] = useState(false);

  const [deleteRole] = useMutation(gql`
    mutation($id: ID!) {
      deleteRole(id: $id)
    }
  `);
  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteRole({
        variables: { id: roleId },
        refetchQueries: ['getRoles'],
      });
      refetch();
    } catch (error) {
      console.error('Ошибка при удалении роли:', error);
      alert('Не удалось удалить роль');
    }
  };

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
        Cell: ({ row }) => (
          <span style={{
            fontWeight: row.original.isSystem ? 'bold' : 'normal',
          }}
          >
            {row.original.title}
            {row.original.isSystem && ' (системная)'}
          </span>
        ),
      },

      {
        accessorKey: 'actions',
        header: 'Действия',
        size: 120,
        Cell: ({ row }) => (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Tooltip title={row.original.isSystem ? 'Системную роль нельзя изменить' : 'Редактировать'}>
              <IconButton
                onClick={() => {
                  if (!row.original.isSystem) {
                    setEditDialogId(row.index);
                    setEditDialogOpen(true);
                  }
                }}
                disabled={row.original.isSystem}
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Привилегии">
              <IconButton
                onClick={() => {
                  setEditPrivilegesDialogId(row.index);
                  setEditPrivilegesDialogOpen(true);
                }}
                disabled={row.original.name === 'guest' || row.original.name === 'admin'}
              >
                <VpnKey />
              </IconButton>
            </Tooltip>
            <IconButton
              onClick={() => {
                if (!row.original.isSystem) {
                  if (window.confirm(`Удалить роль "${row.original.title}"?`)) {
                    handleDeleteRole(row.original.id);
                  }
                }
              }}
              disabled={row.original.isSystem}
              title={row.original.isSystem ? 'Системную роль нельзя удалить' : 'Удалить'}
              color="error"
            >
              <Delete />
            </IconButton>
          </div>
        ),
      },
    ],
    [router],
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Button
        onClick={() => {
          setEditDialogId(null);
          setEditDialogOpen(true);
        }}
      >
        Добавить
      </Button>
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
        refetch={refetch}
      />
      <EditRolePrivileges
        role={data.getRoles[editPrivilegesDialogId!]}
        privileges={data.getRoles[editPrivilegesDialogId!]
          ?.privileges.map((p: any) => p.privilege) || []}
        open={editPrivilegesDialogOpen}
        onClose={() => {
          setEditPrivilegesDialogOpen(false);
        }}
        refetch={refetch}
      />
    </div>
  );
}

export default RolesPage;
