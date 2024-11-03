'use client';

import { useSnackbar } from 'notistack';
import { gql, useMutation } from '@apollo/client';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const SIGN_IN = gql`
  mutation SignIn($password: String!, $email: String!) {
    signIn(email: $email, password: $password)
  }
`;

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [loginForm, setLoginForm] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [signIn] = useMutation<{ signIn: string }>(SIGN_IN);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!loginForm.email || !loginForm.password) return;

    try {
      const { data } = await signIn({
        variables: { ...loginForm },
      });

      if (data?.signIn) {
        enqueueSnackbar('Вы вошли', { variant: 'success' });
        localStorage.setItem('token', data.signIn);
        router.push('/admin');
      }
    } catch (e) {
      enqueueSnackbar((e as Error).message, { variant: 'error' });
    }
  };

  return (
    <div className="size-full flex items-center justify-center p-4">
      <div className="flex flex-col justify-between items-center bg-white rounded p-5 shadow-lg w-full max-w-md mx-auto">
        <span className="text-2xl font-medium">Вход</span>
        <form onSubmit={handleSubmit} className="flex flex-col mt-2 w-full">
          <TextField
            margin="normal"
            label="E-Mail"
            type="email"
            required
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
          />
          <TextField
            margin="normal"
            label="Пароль"
            type="password"
            required
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
          />
          <Button
            variant="contained"
            className="mt-2"
            type="submit"
            disabled={!loginForm.email || !loginForm.password}
          >
            Войти
          </Button>
          <div className="flex justify-between items-center text-base pt-3.5">
            <Link
              href="restore-password/request"
              className="text-black/60 no-underline"
            >
              Забыли пароль?
            </Link>
            <Link href="register" className="no-underline">
              Зарегистрироваться
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
