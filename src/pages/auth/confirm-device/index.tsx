import UserContext from '@/components/UserContext'
import { gql, useMutation } from '@apollo/client'
import { Button } from '@mui/material'
import Link from 'next/link'
// import { useRouter } from 'next/router'
import { useSnackbar } from 'notistack'
import { useContext, useEffect, useState } from 'react'

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
}

const CONFIRM_DEVICE = gql`
  mutation ($code: ID!) {
      confirmDevice(code: $code)
  }
`
const SEND_MESSAGE_TO_USER = gql `
  mutation ($botId: ID!) {
    sendConfirmMessage(botId: $botId)
  }
`

function ConfirmDevice() {
  const { enqueueSnackbar } = useSnackbar()
  // const router = useRouter();
  const [confirmDevice] = useMutation(CONFIRM_DEVICE)
  const [sendConfirmMessage] = useMutation(SEND_MESSAGE_TO_USER)
  const [code, setCode] = useState<string | null>(null)
  const [botId, setBotId] = useState<string | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)

  const user = useContext(UserContext)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const codeFromUrl = urlParams.get('code')
    const botIdFromUrl = urlParams.get('botId')
    if (codeFromUrl && botIdFromUrl) {
      setCode(codeFromUrl)
      setBotId(botIdFromUrl)
      localStorage.setItem('code', codeFromUrl)
      localStorage.setItem('botId', botIdFromUrl)
     } else {
      enqueueSnackbar('Неверные параметры подтверждения устройства', { variant: 'error' });
     }
 }, [])

 useEffect(() => {
  if (user.user?.id && !isConfirmed) {
   const storedCode = localStorage.getItem('code');
   const storedBotId = localStorage.getItem('botId');

   if (storedCode && storedBotId) {
      handleConfirm(storedCode, storedBotId)
   }
  }
}, [user.user?.id])

  const handleConfirm = async (code: string, botId: string) => {
    if (!code || !botId) {
      enqueueSnackbar('Неверный код подтверждения устройства', { variant: 'error' })
      return
    }
    try {
      const { data } = await confirmDevice({
        variables: { code, botId },
      })

      if (data.confirmDevice) {
        // enqueueSnackbar('Устройство успешно подтверждено', { variant: 'success' })
        // router.push('/')
        setIsConfirmed(true)
        await sendConfirmMessage({
          variables: { botId },
        })
        localStorage.removeItem('code')
        localStorage.removeItem('botId')
      } else {
        enqueueSnackbar('Ошибка подтверждения устройства', { variant: 'error' })
      }
    } catch (error) {
      enqueueSnackbar('Ошибка подтверждения устройства', { variant: 'error' })
    }
  }
  if (!global.window) {
    return null
  }
  if (!user.user?.id) {
    return (
      <div style={styles.container}>
        <Link href="/auth/login">
          <Button variant="contained">
            Войдите, чтобы привязать аккаунт
          </Button>
        </Link>
      </div>
    )
  }
  if (isConfirmed) {
    return (
      <div style={styles.container}>
        <h1>
          Устройство успешно подтверждено
          <br />
          <br />
          Зайдите в телеграмме в бота и введите повторно в боте команду /start
        </h1>
      </div>
    )
  }
  return (
    <div style={styles.container}>
      <button onClick={() => handleConfirm(code!, botId!)} style={styles.button} type="button">Подтвердить</button>
    </div>
  )
}

export default ConfirmDevice
