import React, { useState, useEffect } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem } from '@mui/material';
import { Role, Privilege } from '../../../../../components/entities/ITablePrivilege';

const GET_PRIVILEGES = gql`
query GetPrivilegesByTableId($tableId: String!) {
    getPrivilegesByTableId(tableId: $tableId) {
     roleId
     privilege
    }
}
`;

const UPDATE_PRIVILEGES = gql`
mutation UpdatePrivileges($tableId: String!, $roleId: Role!, $privileges: [Privilege!]!) {
    updatePrivileges(tableId: $tableId, roleId: $roleId, privileges: $privileges)
}
`;

function PrivilegesPage({ tableId }) {
const { data, refetch } = useQuery(GET_PRIVILEGES, { variables: { tableId } });
const [updatePrivileges] = useMutation(UPDATE_PRIVILEGES);

const handlePrivilegeChange = (roleId, newPrivileges) => {
    updatePrivileges({ variables: { tableId, roleId, privileges: newPrivileges } });
    refetch();
};

return (
    <TableContainer>
     <Table>
        <TableHead>
         <TableRow>
            <TableCell>Роль</TableCell>
            <TableCell>Право</TableCell>
         </TableRow>
        </TableHead>
        <TableBody>
         {data?.getPrivilegesByTableId.map(({ roleId, privilege }) => (
            <TableRow key={roleId}>
             <TableCell>{roleId}</TableCell>
             <TableCell>
                <Select
                 multiple
                 value={privilege}
                 onChange={(e) => handlePrivilegeChange(roleId, e.target.value)}
                >
                 {Object.values(Privilege).map((priv) => (
                    <MenuItem key={priv} value={priv}>
                     {priv}
                    </MenuItem>
                 ))}
                </Select>
             </TableCell>
            </TableRow>
         ))}
        </TableBody>
     </Table>
    </TableContainer>
);
}

export default PrivilegesPage;