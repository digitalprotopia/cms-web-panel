import React, { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, Box, Chip, FormControl, InputLabel, OutlinedInput, Button } from '@mui/material';
import { useSnackbar } from 'notistack';
import { Privilege } from '../../../../../components/entities/ITablePrivilege';

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
    }
}
`;

const UPDATE_PRIVILEGES = gql`
mutation UpdatePrivileges($tableId: String!, $roleId: String!, $privileges: [Privilege!]!) {
    updatePrivileges(tableId: $tableId, roleId: $roleId, privileges: $privileges)
}
`;

function PrivilegesPage() {
    const currentUrl = window.location.pathname;
    const parts = currentUrl.split('/');
    const tableId = parts[parts.indexOf('tables') + 1];

    const { data: rolesData, loading: rolesLoading, error: rolesError } = useQuery(GET_ROLES);
    const { data: privilegesData, loading: privilegesLoading, error: privilegesError, refetch } = useQuery(GET_PRIVILEGES, { variables: { tableId } });
    const [updatePrivileges] = useMutation(UPDATE_PRIVILEGES);
    const { enqueueSnackbar } = useSnackbar();

    const [privilegesState, setPrivilegesState] = useState({});

    const handlePrivilegeChange = (roleId, newPrivileges) => {
        setPrivilegesState((prevState) => ({
            ...prevState,
            [roleId]: newPrivileges,
        }));
    };

    const handleSave = async () => {
        try {
            await Promise.all(Object.entries(privilegesState).map(([roleId, privileges]) => {
                const role = rolesData.getRoles.find(role => role.id === roleId);
                if (role) {
                    const validPrivileges = privileges.filter(priv => Object.values(Privilege).includes(priv));
                    return updatePrivileges({ variables: { tableId, roleId, privileges: validPrivileges } });
                }
                return Promise.resolve();
            }));
            enqueueSnackbar('Права успешно обновлены!', { variant: 'success' });
            refetch();
        } catch (error) {
            enqueueSnackbar('Ошибка при обновлении прав.', { variant: 'error' });
        }
    };

    if (rolesLoading || privilegesLoading) return <p>Loading...</p>;
    if (rolesError) return <p>Error: {rolesError.message}</p>;
    if (privilegesError) return <p>Error: {privilegesError.message}</p>;

    const groupedPrivileges = privilegesData?.getPrivilegesByTableId.reduce((acc, { roleId, privilege }) => {
        if (!acc[roleId]) {
            acc[roleId] = { roleId, privileges: [] };
        }
        acc[roleId].privileges.push(privilege);
        return acc;
    }, {});

    return (
        <div className="rounded p-4 shadow-lg bg-white">
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Роль</TableCell>
                            <TableCell>Право</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rolesData.getRoles.map(({ id, title }) => {
                            const privileges = groupedPrivileges?.[id]?.privileges || [];
                            return (
                                <TableRow key={id}>
                                    <TableCell>{title}</TableCell>
                                    <TableCell>
                                        <FormControl sx={{ m: 1, width: 300 }}>
                                            <InputLabel id={`privilege-label-${id}`}>Privileges</InputLabel>
                                            <Select
                                                labelId={`privilege-label-${id}`}
                                                multiple
                                                value={privilegesState[id] || privileges}
                                                onChange={(e) => handlePrivilegeChange(id, e.target.value)}
                                                input={<OutlinedInput id={`select-multiple-chip-${id}`} label="Privileges" />}
                                                renderValue={(selected) => (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {selected.map((value) => (
                                                            <Chip key={value} label={value} />
                                                        ))}
                                                    </Box>
                                                )}
                                            >
                                                {Object.values(Privilege).map((priv) => (
                                                    <MenuItem key={priv} value={priv}>
                                                        {priv}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                <Button variant="contained" color="primary" onClick={handleSave} sx={{ mt: 2 }}>
                    Сохранить
                </Button>
            </TableContainer>
        </div>
    );
}

export default PrivilegesPage;