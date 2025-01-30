import { gql, useMutation } from '@apollo/client';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

const CONFIRM_DEVICE = gql`
mutation ($code: ID!) {
    confirmDevice(code: $code)
}
`;
console.log('Hello web')
function ConfirmDevice() {
    const { enqueueSnackbar } = useSnackbar();
    const router = useRouter();
    const [confirmDevice] = useMutation(CONFIRM_DEVICE);
    const [code, setCode] = useState<string | null>(null);

    useEffect(() => {
        const urlCode = new URLSearchParams(window.location.search).get('code');
        console.log('I here!!!---->', urlCode)
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
                console.log('Ошибонька!!!!!!!!----------')
                enqueueSnackbar('Ошибка подтверждения устройства', { variant: 'error' });
            }
        } catch (error) {
            console.log('Ошибонька2222!!!!!!!!----------')

            enqueueSnackbar('Ошибка подтверждения устройства', { variant: 'error' });
        }
    };

    if (!global.window) {
        return null;
    }

    return (
        <div>
            <button onClick={handleConfirm}>Подтвердить</button>
        </div>
    );
}

export default ConfirmDevice;