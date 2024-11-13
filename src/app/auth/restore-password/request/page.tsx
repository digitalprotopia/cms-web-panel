'use client';

import { Button, TextField } from '@mui/material';
import Link from '@mui/material/Link';
import { gql, useMutation } from '@apollo/client';
import { useState } from 'react';
import { useSnackbar } from 'notistack';

const SEND_PASSWORD_RECOVER_LINK = gql`
  mutation ($email: String!) {
    sendRecoverPasswordLink(email: $email)
  }
`;

export default function Page() {
  const { enqueueSnackbar } = useSnackbar();
  const [sendPasswordRecoverLink] = useMutation(SEND_PASSWORD_RECOVER_LINK);
  const [email, setEmail] = useState('');

  return (
    <div className="size-full flex items-center justify-center">
      <div className="flex flex-col justify-between items-center bg-white rounded p-5 shadow-lg w-1/4">
        <span className="text-2xl font-medium">Восстановление пароля</span>
        <div className="mt-1">
          <TextField
            margin="normal"
            fullWidth
            label="E-Mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 1 }}
            disabled={!email}
            onClick={async () => {
              try {
                await sendPasswordRecoverLink({ variables: { email } });
              } catch (e) {
                enqueueSnackbar(e.message, { variant: 'error' });
                return;
              }
              enqueueSnackbar(
                'Ссылка для восстановления пароля отправлена на указанный E-Mail',
                { variant: 'success' },
              );
            }}
          >
            Выслать ссылку
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
