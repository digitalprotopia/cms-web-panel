import { useSnackbar } from 'notistack';
import { gql, useMutation } from '@apollo/client';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import { useState } from 'react';
import { Checkbox, FormControlLabel } from '@mui/material';

const SIGN_UP = gql`
  mutation ($user: UserRegister!) {
    signUp(user: $user) {
      id
    }
  }
`;

export function Register() {
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    repeatPassword: '',
    acceptedPrivacy: false,
  });
  const [signUp] = useMutation(SIGN_UP);
  const { enqueueSnackbar } = useSnackbar();

  return (
    <div className="flex flex-col justify-between items-center bg-white rounded p-5 shadow-lg w-full max-w-md">
      <span className="text-2xl font-medium">Регистрация</span>
      <div className="flex flex-col w-full">
        <TextField
          margin="normal"
          label="ФИО"
          required
          name="name"
          value={registerForm.name}
          onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
          slotProps={{
            htmlInput: { maxLength: 255 },
          }}
        />
        {/* <TextField */}
        {/*  margin="normal" */}
        {/*  label="Компания" */}
        {/*  name="company" */}
        {/*  value={registerForm.company} */}
        {/*  onChange={(e) => */}
        {/*    setRegisterForm({ ...registerForm, company: e.target.value }) */}
        {/*  } */}
        {/* /> */}
        <TextField
          margin="normal"
          label="E-Mail"
          required
          name="email"
          value={registerForm.email}
          onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
          slotProps={{
            htmlInput: { maxLength: 255 },
          }}
        />
        {/* <MuiTelInput */}
        {/*  className="mt-4" */}
        {/*  label="Номер телефона" */}
        {/*  value={registerForm.phone} */}
        {/*  onChange={(value) => */}
        {/*    setRegisterForm({ ...registerForm, phone: value }) */}
        {/*  } */}
        {/*  preferredCountries={["RU"]} */}
        {/*  defaultCountry="RU" */}
        {/* /> */}
        <TextField
          margin="normal"
          label="Пароль"
          required
          type="password"
          value={registerForm.password}
          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
          slotProps={{
            htmlInput: { maxLength: 255 },
          }}
        />
        {' '}
        <TextField
          margin="normal"
          label="Повторите пароль"
          required
          type="password"
          value={registerForm.repeatPassword}
          onChange={(e) => setRegisterForm({
            ...registerForm,
            repeatPassword: e.target.value,
          })}
          slotProps={{
            htmlInput: { maxLength: 255 },
          }}
        />
        {/* {config.license
                && (
                <TextField
                  margin="normal"
                  label="Лицензионный ключ"
                  name="license"
                  value={registerForm.license}
                  onChange={(e) => setRegisterForm({ ...registerForm, license: e.target.value })}
                />
                )} */}
        <FormControlLabel
          control={(
            <Checkbox
              value={registerForm.acceptedPrivacy}
              onChange={(e) => {
                setRegisterForm({
                  ...registerForm,
                  acceptedPrivacy: e.target.checked,
                });
              }}
            />
            )}
          label={(
            <span>
              Соглашаюсь с
              {' '}
              <Link className="no-underline" href="https://s3app.ru/privacy">
                политикой обработки персональных данных
              </Link>
            </span>
            )}
        />
        <Button
          variant="contained"
          sx={{ mt: 1 }}
          disabled={
              !registerForm.name
              || !registerForm.email
              || !registerForm.password
              || registerForm.password !== registerForm.repeatPassword
              // !registerForm.acceptedPrivacy
              // || (config.license && !registerForm.license)
            }
          onClick={async () => {
            try {
              await signUp({
                variables: {
                  user: {
                    name: registerForm.name,
                    email: registerForm.email,
                    password: registerForm.password,
                  },
                },
                onCompleted: () => {
                  enqueueSnackbar(
                    window.config.noConfirmation
                      ? 'Регистрация прошла успешно'
                      : 'Регистрация прошла успешно. Пожалуйста, подтвердите свою почту.',
                    {
                      variant: 'success',
                    },
                  );
                },
              });
            } catch (error: any) {
              enqueueSnackbar(error.message, { variant: 'error' });
            }
          }}
        >
          Зарегистрироваться
        </Button>
        <span className="text-center text-base font-light mt-4 text-black/60">
          Уже есть аккаунт?
          {' '}
          <Link href="/auth/login" className="no-underline">
            Войти
          </Link>
        </span>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="size-full flex items-center justify-center p-4 mx-auto">
      <Register />
    </div>
  );
}
