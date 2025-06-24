import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, MenuItem, Select, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useSnackbar } from 'notistack';
import { IField } from '../entities/IField';
import { IRole } from '../entities/IRole';
import { IFieldPrivilege, Privilege } from '../entities/IFieldPrivilege';

const GET_ROLES = gql`
query GetRoles {
    getRoles {
        id
        title
        name
    }
}
`;

const GET_FIELD_PRIVILEGES = gql`
query GetPrivilegesByFieldId($fieldId: String!) {
    getPrivilegesByFieldId(fieldId: $fieldId) {
        roleId
        privilege
    }
}
`;

const UPDATE_FIELD_PRIVILEGES = gql`
mutation UpdateFieldPrivileges($fieldId: String!, $roleId: String!, $privilege: FieldPrivilegeInput!) {
    updateFieldPrivileges(fieldId: $fieldId, roleId: $roleId, privilege: $privilege)
}
`;

function FieldPrivilegesDialog({
  open,
  onClose,
  field,
}: {
  open: boolean;
  onClose: () => void;
  field: IField | null;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [privileges, setPrivileges] = useState<Record<string, Privilege>>({});

  const {
    data: rolesData,
    loading: rolesLoading,
    error: rolesError,
  } = useQuery(GET_ROLES);

  const {
    data: privilegesData,
    loading: privilegesLoading,
    error: privilegesError,
    refetch: refetchPrivileges,
  } = useQuery(GET_FIELD_PRIVILEGES, {
    variables: { fieldId: field?.id },
    skip: !field?.id || !open,
  });

  const [updateFieldPrivilege] = useMutation(UPDATE_FIELD_PRIVILEGES, {
    onCompleted: () => {
      refetchPrivileges();
    },
    onError: (error) => {
      enqueueSnackbar(`Ошибка при обновлении прав: ${error.message}`, { variant: 'error' });
    },
  });

  useEffect(() => {
    if (privilegesData) {
      const newPrivileges = privilegesData
        .getPrivilegesByFieldId.reduce((
          acc: Record<string, Privilege>,
          { roleId, privilege }: IFieldPrivilege,
        ) => {
          acc[roleId] = privilege;
          return acc;
        }, {});
      setPrivileges(newPrivileges);
    }
  }, [privilegesData]);

  const handlePrivilegeChange = (roleId: string, newPrivilege: Privilege) => {
    setPrivileges((prev) => ({
      ...prev,
      [roleId]: newPrivilege,
    }));
  };

  const handleSave = async () => {
    if (!field?.id) return;
    try {
      await Promise.all(
        Object.entries(privileges).map(([roleId, privilege]) => updateFieldPrivilege({
          variables: {
            fieldId: field.id,
            roleId,
            privilege: {
              privilege,
            },
          },
        })),
      );
      enqueueSnackbar('Права успешно обновлены!', { variant: 'success' });
      onClose();
    } catch (error) {
      console.error('Error saving privileges:', error);
    }
  };

  if (rolesLoading || privilegesLoading) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>
          Права доступа для поля:
          {' '}
          <strong>{field?.name}</strong>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (rolesError || privilegesError) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>
          Права доступа для поля:
          {' '}
          <strong>{field?.name}</strong>
        </DialogTitle>
        <DialogContent>
          <Typography color="error">
            Ошибка загрузки данных:
            {' '}
            {rolesError?.message || privilegesError?.message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Права доступа для поля:
        {' '}
        <strong>{field?.name}</strong>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ marginTop: 2 }}>
          {rolesData?.getRoles?.map((role: IRole) => (
            <Box key={role.id} mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                {role.title || role.name}
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={privileges[role.id] || Privilege.READ}
                  onChange={(e) => handlePrivilegeChange(role.id, e.target.value as Privilege)}
                >
                  <MenuItem value={Privilege.READ}>Чтение</MenuItem>
                  <MenuItem value={Privilege.WRITE}>Запись</MenuItem>
                  <MenuItem value={Privilege.FORBIDDEN}>Запрещено</MenuItem>
                </Select>
              </FormControl>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={rolesLoading || privilegesLoading}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FieldPrivilegesDialog;
