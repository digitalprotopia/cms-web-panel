import { Button, TextField } from '@mui/material';
import Link from '@mui/material/Link';
import { gql, useMutation } from '@apollo/client';
import { useState } from 'react';
import { useSnackbar } from 'notistack';

const CHANGE_PASSWORD_AFTER_RECOVER = gql`
  mutation ($code: ID!, $password: String!) {
    changePasswordAfterRecover(code: $code, password: $password)
  }
`;

export default function Page() {
  const { enqueueSnackbar } = useSnackbar();
  const [changePasswordAfterRecover] = useMutation(
    CHANGE_PASSWORD_AFTER_RECOVER,
  );
  const [form, setForm] = useState({
    password: '',
    passwordConfirm: '',
  });

  if (!global.window) {
    return null;
  }

  const code = new URLSearchParams(window.location.search).get('code');

  return (
    <div className="size-full flex items-center justify-center">
      <div className="flex flex-col justify-between items-center bg-white rounded p-5 shadow-lg w-1/4">
        <span className="text-2xl font-medium">Восстановление пароля</span>
        <div className="mt-1">
          <TextField
            margin="normal"
            fullWidth
            label="Пароль"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Подтверждение пароля"
            type="password"
            value={form.passwordConfirm}
            onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
          />
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 1 }}
            disabled={
              !form.password
              || !form.passwordConfirm
              || form.password !== form.passwordConfirm
            }
            onClick={async () => {
              try {
                await changePasswordAfterRecover({
                  variables: { code, password: form.password },
                });
              } catch (e: any) {
                enqueueSnackbar(e.message, { variant: 'error' });
                return;
              }
              enqueueSnackbar('Пароль успешно изменен', { variant: 'success' });
            }}
          >
            Сменить пароль
          </Button>
          <div className="flex justify-between items-center text-base pt-3.5">
            <Link href="/auth/login" className="no-underline">
              Войти
            </Link>
            <Link href="/auth/register" className="no-underline">
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
