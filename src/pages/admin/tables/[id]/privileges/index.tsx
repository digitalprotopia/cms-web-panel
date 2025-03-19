import React from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, Box, Chip, FormControl, InputLabel, OutlinedInput } from '@mui/material';
import { Privilege } from '../../../../../components/entities/ITablePrivilege';

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
                <FormControl sx={{ m: 1, width: 300 }}>
                 <InputLabel id={`privilege-label-${roleId}`}>Privileges</InputLabel>
                 <Select
                    labelId={`privilege-label-${roleId}`}
                    multiple
                    value={privilege}
                    onChange={(e) => handlePrivilegeChange(roleId, e.target.value)}
                    input={<OutlinedInput id={`select-multiple-chip-${roleId}`} label="Privileges" />}
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
         ))}
        </TableBody>
     </Table>
    </TableContainer>
);
}

export default PrivilegesPage;