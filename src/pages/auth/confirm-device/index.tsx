import { gql, useMutation } from '@apollo/client';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { useEffect } from 'react';

const CONFIRM_DEVICE = gql`
mutation ($code: ID!) {
    confirmDevice(code: $code)
}
`;

function ConfirmDevice() {
const { enqueueSnackbar } = useSnackbar();
const router = useRouter();
const [confirmDevice] = useMutation(CONFIRM_DEVICE);

const code = new URLSearchParams(window.location.search).get('code');

useEffect(() => {
    if (!code) {
     enqueueSnackbar('Неверный код подтверждения устройства', { variant: 'error' });
     return;
    }
    (async () => {
     try {
        const { data } = await confirmDevice({
         variables: { code },
        });

        if (data.confirmDevice) {
         enqueueSnackbar('Устройство успешно подтверждено', { variant: 'success' });
         router.push('/');
        } else {
         enqueueSnackbar('Ошибка подтверждения устройства', { variant: 'error' });
        }
     } catch (error) {
        enqueueSnackbar('Ошибка подтверждения устройства', { variant: 'error' });
     }
    })();
}, []);

if (!global.window) {
    return null;
}

return <div />;
}

export default ConfirmDevice;