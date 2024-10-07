import { useSnackbar } from 'notistack';
import { gql, useMutation } from '@apollo/client';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { MuiTelInput } from 'mui-tel-input';
import { Checkbox, FormControlLabel } from '@mui/material';
import config from '../config/config';

const SIGN_UP = gql`
mutation($user: UserRegister!) {
  signUp(user: $user) {
    id
  }
}
`;

export default function Register(props) {
  const router = useRouter();

  const [registerForm, setRegisterForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    password: '',
    repeatPassword: '',
    acceptedPrivacy: false,
    license: '',
  });
  const [signUp] = useMutation(SIGN_UP);
  const { enqueueSnackbar } = useSnackbar();

  if (props?.user?.domains.length > 0) {
    router.push(`/domains/${props.user.domains[0].id}`);
  }

  if (props?.user?.domains.length === 0) {
    if (config.demo) router.push('/');
    else router.push('/welcomePage');
  }

  return (
    <div
      className="flex items-center justify-center"
    >
      <div className="flex flex-col justify-between items-center bg-white rounded p-5 shadow-lg w-1/3">
        <span className="text-2xl font-medium">
          Регистрация
        </span>
        <div className="flex flex-col w-full">
          <TextField
            margin="normal"
            label="ФИО"
            required
            name="name"
            value={registerForm.name}
            onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
          />
          <TextField
            margin="normal"
            label="Компания"
            name="company"
            value={registerForm.company}
            onChange={(e) => setRegisterForm({ ...registerForm, company: e.target.value })}
          />
          <TextField
            margin="normal"
            label="E-Mail"
            required
            name="email"
            value={registerForm.email}
            onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
          />
          <MuiTelInput
            className="mt-4"
            label="Номер телефона"
            value={registerForm.phone}
            onChange={(value) => setRegisterForm({ ...registerForm, phone: value })}
            preferredCountries={['RU']}
            defaultCountry="RU"
          />
          <TextField
            margin="normal"
            label="Пароль"
            required
            type="password"
            value={registerForm.password}
            onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
          />
          {' '}
          <TextField
            margin="normal"
            label="Повторите пароль"
            required
            type="password"
            value={registerForm.repeatPassword}
            onChange={(e) => setRegisterForm({ ...registerForm, repeatPassword: e.target.value })}
          />

          {config.license
                && (
                <TextField
                  margin="normal"
                  label="Лицензионный ключ"
                  name="license"
                  value={registerForm.license}
                  onChange={(e) => setRegisterForm({ ...registerForm, license: e.target.value })}
                />
                )}

          <FormControlLabel
            control={(
              <Checkbox
                value={registerForm.acceptedPrivacy}
                onChange={(e) => {
                  setRegisterForm({ ...registerForm, acceptedPrivacy: e.target.checked });
                }}
              />
            )}
            label={(
              <span>
                Соглашаюсь с
                {' '}
                <Link className="no-underline" href="https://s3app.ru/privacy">политикой обработки персональных данных</Link>
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
                    || !registerForm.acceptedPrivacy
                    || (config.license && !registerForm.license)
                }
            onClick={async () => {
              try {
                await signUp({
                  variables: {
                    user: {
                      name: registerForm.name,
                      company: registerForm.company,
                      email: registerForm.email,
                      phone: registerForm.phone,
                      password: registerForm.password,
                      acceptedPrivacy: registerForm.acceptedPrivacy,
                    },
                  },
                  onCompleted: () => {
                    enqueueSnackbar('Регистрация прошла успешно. Пожалуйста, подтвердите свою почту.', {
                      variant: 'success',
                    });
                  },
                });
              } catch (e) {
                enqueueSnackbar(e.message, { variant: 'error' });
              }
            }}
          >
            Зарегистрироваться
          </Button>
          <span className="text-center text-base font-light mt-4 text-black/60">
            Уже есть аккаунт?
            {' '}
            <Link href="login" className="no-underline">Войти</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
