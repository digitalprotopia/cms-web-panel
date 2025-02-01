import { gql, useMutation } from '@apollo/client';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

const CONFIRM_DEVICE = gql`
mutation ($code: ID!) {
    confirmDevice(code: $code)
}
`;
function ConfirmDevice() {
    const { enqueueSnackbar } = useSnackbar();
    const router = useRouter();
    const [confirmDevice] = useMutation(CONFIRM_DEVICE);
    const [code, setCode] = useState<string | null>(null);

    useEffect(() => {
        const urlCode = new URLSearchParams(window.location.search).get('code');
        if (urlCode) {
            setCode(urlCode);
        } else {
            enqueueSnackbar('Неверный код подтверждения устройства', { variant: 'error' });
        }
    }, []);
    const handleConfirm = async () => {
        if (!code) {
            enqueueSnackbar('Неверный код подтверждения устройства', { variant: 'error' });
            return;
        }
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
    };
    if (!global.window) {
        return null;
    }
    return (
        <div style={styles.container}>
            <button onClick={handleConfirm} style={styles.button}>Подтвердить</button>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
    },
    button: {
        backgroundColor: '#87CEEB',
        border: 'none',
        borderRadius: '12px',
        padding: '10px 20px',
        color: 'white',
        fontSize: '16px',
        fontFamily: '"Gost type B", sans-serif',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'background-color 0.3s',
    },
};

export default ConfirmDevice;