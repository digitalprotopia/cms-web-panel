import React, { useState, useEffect } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { useSnackbar } from 'notistack';
import { IRole } from '@/components/entities/IRole';
import { useRouter } from 'next/router';
import { ITablePrivilege, Privilege } from '../../../../../components/entities/ITablePrivilege';

const GET_ROLES = gql`
query GetRoles {
    getRoles {
        id
        title
        name
    }
}
`;

const GET_PRIVILEGES = gql`
query GetPrivilegesByTableId($tableId: String!) {
    getPrivilegesByTableId(tableId: $tableId) {
        roleId
        privilege
        onlyCreator
    }
}
`;

const GET_TABLE = gql`
query GetTable($id: ID!) {
    getTable(id: $id) {
        id
        name
        dbName
        isSystem
    }
}
`;

const UPDATE_PRIVILEGES = gql`
mutation UpdatePrivileges($tableId: String!, $roleId: String!, $privileges: [TablePrivilegeInput!]!) {
    updatePrivileges(tableId: $tableId, roleId: $roleId, privileges: $privileges)
}
`;

function PrivilegesPage() {
  const router = useRouter();
  const tableId = router.query.id as string;

  const { data: rolesData, loading: rolesLoading, error: rolesError } = useQuery(GET_ROLES);
  const { data: privilegesData,
    loading: privilegesLoading,
    error: privilegesError,
    refetch } = useQuery(GET_PRIVILEGES, { variables: { tableId } });
  const { data: tableData,
    loading: tableLoading,
    error: tableError } = useQuery(GET_TABLE, { variables: { id: tableId } });
  const [updatePrivileges] = useMutation(UPDATE_PRIVILEGES);
  const { enqueueSnackbar } = useSnackbar();

  const [privilegesState, setPrivilegesState] = useState<
  Record<string, Partial<ITablePrivilege>[]>>({});

  useEffect(() => {
    if (privilegesData) {
      const initialState = privilegesData.getPrivilegesByTableId.reduce((
        acc: Record<string, Partial<ITablePrivilege>[]>,
        { roleId, privilege, onlyCreator }: ITablePrivilege,
      ) => {
        if (!acc[roleId]) {
          acc[roleId] = [];
        }
        acc[roleId].push({ privilege, onlyCreator });
        return acc;
      }, {});
      setPrivilegesState(initialState);
    }
  }, [privilegesData]);

  const handlePrivilegeChange = (roleId: string, privilege: Privilege, checked: boolean) => {
    setPrivilegesState((prevState) => {
      const rolePrivileges = prevState[roleId] || [];
      const updatedPrivileges: Partial<ITablePrivilege>[] = checked
        ? [...rolePrivileges, { privilege, onlyCreator: false }]
        : rolePrivileges.filter((p) => p.privilege !== privilege);
      return {
        ...prevState,
        [roleId]: updatedPrivileges,
      };
    });
  };

  const handleOnlyCreatorChange = (roleId: string, privilege: Privilege, onlyCreator: boolean) => {
    setPrivilegesState((prevState) => {
      const rolePrivileges = prevState[roleId] || [];
      const updatedPrivileges = rolePrivileges.map((p) => (
        p.privilege === privilege ? { ...p, onlyCreator } : p));
      return {
        ...prevState,
        [roleId]: updatedPrivileges,
      };
    });
  };

  const handleSave = async () => {
    try {
      await Promise.all(Object.entries(privilegesState).map(([roleId, privileges]) => {
        const role = rolesData.getRoles.find((_role: IRole) => _role.id === roleId);
        if (role) {
          return updatePrivileges({ variables: { tableId, roleId, privileges } });
        }
        return Promise.resolve();
      }));
      enqueueSnackbar('Права успешно обновлены!', { variant: 'success' });
      refetch();
    } catch (error) {
      enqueueSnackbar('Ошибка при обновлении прав.', { variant: 'error' });
    }
  };

  if (rolesLoading || privilegesLoading || tableLoading) return <p>Loading...</p>;
  if (rolesError) {
    return (
      <p>
        Error:
        {rolesError.message}
      </p>
    );
  }
  if (privilegesError) {
    return (
      <p>
        Error:
        {privilegesError.message}
      </p>
    );
  }
  if (tableError) {
    return (
      <p>
        Error:
        {tableError.message}
      </p>
    );
  }

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <h2 className="text-2xl font-semibold">
        {'Права таблицы '}
        {tableData.getTable.name}
      </h2>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Роль</TableCell>
              <TableCell>Право</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rolesData.getRoles.map(({ id, name, title }: IRole) => {
              const privileges: Partial<ITablePrivilege>[] = privilegesState[id] || [];
              return (
                <TableRow key={id}>
                  <TableCell>{title}</TableCell>
                  <TableCell>
                    <FormGroup>
                      {Object.values(Privilege).filter((priv) => {
                        if (tableData.getTable.isSystem) {
                          return priv !== Privilege.CREATE && priv !== Privilege.DELETE;
                        }
                        return true;
                      })
                        .map((priv) => {
                          const isChecked = privileges.some((p) => p.privilege === priv);
                          const onlyCreatorChecked = privileges.some(
                            (p) => p.privilege === priv && p.onlyCreator,
                          );
                          return (
                            <div key={priv} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <FormControlLabel
                                control={
                                (<Checkbox
                                  checked={isChecked}
                                  onChange={
                                    (e) => handlePrivilegeChange(id, priv, e.target.checked)
}
                                />)
                                                            }
                                label={priv}
                                style={{ flex: 1 }}
                              />
                              <div style={{ display: 'flex', alignItems: 'center', marginLeft: '-100px' }}>
                                {name !== 'guest' && priv !== Privilege.CREATE && isChecked && (
                                <FormControlLabel
                                  control={
                                    (<Checkbox
                                      checked={onlyCreatorChecked}
                                      onChange={
                                        (e) => handleOnlyCreatorChange(id, priv, e.target.checked)
}
                                    />)
                                    }
                                  label="Только владелец"
                                />
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </FormGroup>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <div style={{ display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingTop: 20 }}
      >
        <Button variant="contained" color="primary" onClick={handleSave}>
          Сохранить
        </Button>
        <Button onClick={() => router.push(`/admin/tables/${tableId}`)}>
          Вернуться к таблице
        </Button>
      </div>
    </div>
  );
}

export default PrivilegesPage;
