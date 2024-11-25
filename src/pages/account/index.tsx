import { gql, useMutation } from '@apollo/client';
import Head from 'next/head';
import { useState } from 'react';
import { Button, Divider, TextField } from '@mui/material';
import { useSnackbar } from 'notistack';
import moment from 'moment';
import { AccountCircle } from '@mui/icons-material';
import config from '../../config/config';

const EDIT_ME = gql`
    mutation($user: UserInput!) {
        editMe(user: $user) {
            id
            name
        }
    }
  `;

const CHANGE_PASSWORD = gql`
  mutation($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
      id
      name
    }
  }
`;

const SEND_EMAIL_CONFIRMATION_LINK = gql`
  mutation($email: String!) {
    sendEmailConfirmationLink(email: $email)
  }
`;

export default function Account(props) {
  const { enqueueSnackbar } = useSnackbar();

  const [form, setForm] = useState({
    name: props.user.name,
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    newPasswordConfirm: '',
  });

  const [editMe] = useMutation(EDIT_ME);
  const [changePassword] = useMutation(CHANGE_PASSWORD);
  const [sendEmailConfirmationLink] = useMutation(SEND_EMAIL_CONFIRMATION_LINK);

  return (
    <div className="size-full">
      <Head>
        <title>Аккаунт</title>
      </Head>
      <h2 className="font-medium text-xl text-black/60 mb-3.5 uppercase">Аккаунт</h2>
      <div
        className="flex items-center bg-white rounded p-6 shadow-lg mb-5 text-base text-black/60 font-medium"
      >
        {/* {config.license && (
        <>
          <Divider className="mx-2 border" flexItem orientation="vertical" />
          <span>
            Ключ до
            {' '}
            {moment(props.user.licenseExpires).format('hh:mm:ss DD.MM.YYYY')}
          </span>
        </>
        )} */}
      </div>
      <div className="flex justify-between gap-6">
        <div className="flex flex-col bg-white rounded p-5 shadow-lg w-1/4 grow">
          <span className="text-black/60 text-xl font-medium mb-6">
            РЕДАКТИРОВАТЬ ДАННЫЕ
            {' '}
          </span>
          <div className="flex my-6">
            <AccountCircle className="size-10 mr-4 text-black/60" />
            <div className="flex flex-col">
              <span className="text-base">{props.user.name}</span>
              <span
                className="text-black/60 text-sm"
              >
                {props.user.role === 'admin' ? 'Администратор' : 'Пользователь'}
              </span>
            </div>
          </div>
          <div>
            <TextField
              label="Имя"
              className="w-full"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              variant="outlined"
            />
          </div>
          <div style={{ marginBottom: '40px' }}>
            <Button
              className="normal-case bg-primary/20 text-primary text-lg font-normal mt-4"
              variant="contained"
              disabled={
                      form.name === props.user.name
                  }
              onClick={async () => {
                await editMe({
                  variables: { user: { name: form.name } },
                });
                await props.refetchUser();
                enqueueSnackbar('Данные успешно изменены', { variant: 'success' });
              }}
            >
              Сохранить
            </Button>
          </div>
        </div>
        <div className="flex flex-col bg-white rounded p-5 shadow-lg w-1/4 grow">
          <span className="text-black/60 text-xl font-medium mb-6">
            СМЕНИТЬ E-MAIL
          </span>
          <div>
            {/* TODO: Добавить отображение текущего e-mail */}
            {/* <span className="font-light text-base"> */}
            {/*  Текущий: */}
            {/* </span> */}
            <TextField
              className="w-full my-4"
              label="Новый email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              variant="outlined"
            />
          </div>
          <div>
            <Button
              className="normal-case bg-primary/20 text-primary text-lg font-normal mt-4"
              variant="contained"
              disabled={
                      form.email === props.user.email
                  }
              onClick={async () => {
                await sendEmailConfirmationLink({ variables: { email: form.email } });
                enqueueSnackbar('Письмо с подтверждением отправлено', { variant: 'success' });
              }}
            >
              Сохранить
            </Button>
          </div>
        </div>
        <div className="flex flex-col bg-white rounded p-5 shadow-lg w-1/4 grow">
          <span className="text-black/60 text-xl font-medium mb-6">
            СМЕНИТЬ ПАРОЛЬ
          </span>
          <div className="flex flex-col gap-5">
            <TextField
              className="w-full"
              label="Старый пароль"
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
              type="password"
            />
            <TextField
              className="w-full"
              label="Новый пароль"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              variant="outlined"
              type="password"
            />
            <TextField
              className="w-full"
              label="Подтвердите новый пароль"
              value={passwordForm.newPasswordConfirm}
              onChange={(e) => setPasswordForm(
                { ...passwordForm, newPasswordConfirm: e.target.value },
              )}
              variant="outlined"
              type="password"
            />
          </div>
          <div className="mt-4">
            <Button
              className="normal-case bg-primary/20 text-primary text-lg font-normal mt-4"
              variant="contained"
              disabled={
                      passwordForm.newPassword !== passwordForm.newPasswordConfirm
                      || passwordForm.newPassword === ''
                      || passwordForm.oldPassword === ''
                  }
              onClick={async () => {
                try {
                  await changePassword({
                    variables: {
                      oldPassword: passwordForm.oldPassword,
                      newPassword: passwordForm.newPassword,
                    },
                  });
                } catch (e) {
                  enqueueSnackbar(e.message, { variant: 'error' });
                  return;
                }
                await props.refetchUser();
                enqueueSnackbar('Пароль успешно изменен', { variant: 'success' });
              }}
            >
              Сохранить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
