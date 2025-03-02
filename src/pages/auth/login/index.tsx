import { useSnackbar } from 'notistack';
import { gql, useMutation } from '@apollo/client';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import { FormEvent, useContext, useState } from 'react';
import { useRouter } from 'next/router';
import UserContext from '@/components/UserContext';

const SIGN_IN = gql`
mutation SignIn($password: String!, $email: String!) {
    signIn(email: $email, password: $password)
}
`;

const CONFIRM_DEVICE = gql`
mutation ($code: ID!) {
    confirmDevice(code: $code)
}
`;

const SEND_MESSAGE_TO_USER = gql`
mutation ($botId: ID!) {
    sendConfirmMessage(botId: $botId)
}
`;

interface LoginFormData {
email: string;
password: string;
}

export function Login() {
const router = useRouter();
const { enqueueSnackbar } = useSnackbar();

const [loginForm, setLoginForm] = useState<LoginFormData>({
    email: '',
    password: '',
});

const [signIn] = useMutation<{ signIn: string }>(SIGN_IN);
const [confirmDevice] = useMutation(CONFIRM_DEVICE);
const [sendConfirmMessage] = useMutation(SEND_MESSAGE_TO_USER);

const user = useContext(UserContext);

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
        await user.refetch();

        const storedCode = localStorage.getItem('code');
        const storedBotId = localStorage.getItem('botId');
        console.log('Stored Code:', storedCode);
        console.log('Stored BotId:', storedBotId);

        if (storedCode && storedBotId) {
         const confirmResult = await confirmDevice({ variables: { code: storedCode } });
         if (confirmResult.data.confirmDevice) {
            await sendConfirmMessage({ variables: { botId: storedBotId } });
            enqueueSnackbar('Устройство успешно подтверждено', { variant: 'success' });
         } else {
            enqueueSnackbar('Ошибка подтверждения устройства', { variant: 'error' });
         }
        }

        router.push('/admin');
     }
    } catch (error) {
     enqueueSnackbar((error as Error).message, { variant: 'error' });
    }
};

return (
    <div className="flex flex-col justify-between items-center bg-white rounded p-5 shadow-lg w-full max-w-md">
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
            href="/auth/restore-password/request"
            className="text-black/60 no-underline"
         >
            Забыли пароль?
         </Link>
         <Link href="/auth/register" className="no-underline">
            Зарегистрироваться
         </Link>
        </div>
     </form>
    </div>
);
}

export default function LoginPage() {
return (
    <div className="size-full flex items-center justify-center p-4 mx-auto">
     <Login />
    </div>
);
}