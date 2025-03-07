import UserContext from '@/components/UserContext';
import { gql, useMutation } from '@apollo/client';
import { Button } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { useContext, useEffect, useState } from 'react';

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

const CONFIRM_DEVICE = gql`
  mutation ($code: ID! $botId: ID) {
      confirmDevice(code: $code botId: $botId)
  }
`;

function ConfirmDevice() {
  const { enqueueSnackbar } = useSnackbar();
  const [confirmDevice] = useMutation(CONFIRM_DEVICE);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const user = useContext(UserContext);
  const router = useRouter();

  useEffect(() => {
    const { code, botId } = router.query;

    if (code && botId) {
      localStorage.setItem('code', code as string);
      localStorage.setItem('botId', botId as string);
      console.log('DATA FROM DEVICEconfirmPAGE---->', code, botId);
    }
  }, [router.query]);

  const handleConfirm = async () => {
    const storedCode = localStorage.getItem('code');
    const storedBotId = localStorage.getItem('botId');

    console.log('local storage from confirm page', storedCode);

    if (!storedCode || !storedBotId) {
      enqueueSnackbar('Неверный код подтверждения устройства', { variant: 'error' });
      return;
    }

    try {
      const { data } = await confirmDevice({
        variables: { code: storedCode, botId: storedBotId },
      });

      if (data.confirmDevice) {
        setIsConfirmed(true);
        enqueueSnackbar('Устройство успешно подтверждено', { variant: 'success' });
      } else {
        enqueueSnackbar('Ошибка подтверждения устройства', { variant: 'error' });
      }
    } catch (error) {
      enqueueSnackbar('Ошибка подтверждения устройства', { variant: 'error' });
    }
  };

  if (!user.user?.id) {
    return (
      <div style={styles.container}>
        <Link href="/auth/login">
          <Button variant="contained">
            Войдите, чтобы привязать аккаунт
          </Button>
        </Link>
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div style={styles.container}>
        <h1>
          Устройство успешно подтверждено

          Зайдите в телеграмме в бота и введите повторно в боте команду /start
        </h1>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button onClick={handleConfirm} style={styles.button} type="button">
        Подтвердить
      </button>
    </div>
  );
}

export default ConfirmDevice;
