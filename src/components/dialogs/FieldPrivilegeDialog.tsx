import { Dialog, DialogContent, DialogTitle } from '@mui/material';
import { IField } from '../entities/IField';

function FieldPrivilegesDialog({
    open,
    onClose,
    field,
  }: {
    open: boolean;
    onClose: () => void;
    field: IField | null;
  }) {
    const [privileges, setPrivileges] = useState<{role: string; permission: string}[]>([]);
    const roles = ['admin', 'editor', 'viewer']; // Замените на реальные роли из вашей системы
  
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>
          Права доступа для поля: <strong>{field?.name}</strong>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ marginTop: 2 }}>
            <MaterialReactTable
              columns={[
                {
                  accessorKey: 'role',
                  header: 'Роль',
                  Cell: ({ cell }) => (
                    <FormControl fullWidth size="small">
                      <Select
                        value={cell.getValue() as string}
                        onChange={(e) => {
                          // Логика обновления роли
                        }}
                      >
                        {roles.map((role) => (
                          <MenuItem key={role} value={role}>
                            {role}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ),
                },
                {
                  accessorKey: 'permission',
                  header: 'Право',
                  Cell: ({ cell }) => (
                    <FormControl fullWidth size="small">
                      <Select
                        value={cell.getValue() as string}
                        onChange={(e) => {
                          // Логика обновления права
                        }}
                      >
                        <MenuItem value="read">Чтение</MenuItem>
                        <MenuItem value="edit">Редактирование</MenuItem>
                        <MenuItem value="none">Нет доступа</MenuItem>
                      </Select>
                    </FormControl>
                  ),
                },
              ]}
              data={privileges}
              enableTopToolbar={false}
              renderTopToolbarCustomActions={() => (
                <Button
                  variant="contained"
                  onClick={() => setPrivileges([...privileges, { role: '', permission: '' }])}
                >
                  Добавить правило
                </Button>
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              // Логика сохранения прав
              onClose();
            }}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    );
  }