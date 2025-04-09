import { Button, CircularProgress, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { gql, useMutation, useQuery } from '@apollo/client';
import { IUser } from '@/components/entities/IUser';
import { useState } from 'react';

export default function PostEditPost() {
  const router = useRouter();
  const { id } = router.query;

  const [formData, setFormData] = useState<Partial<IUser>>({
    name: '',
    email: '',
  });

  const { loading } = useQuery(gql`
    query ($id: ID!) {
      getUser(id: $id) {
        id
        name
        email
      }
    }
  `, {
    variables: { id },
    skip: !id,
    onCompleted: (data) => {
      setFormData({
        name: data.getUser.name,
        email: data.getUser.email,
      });
    },
  });

  const [editUser] = useMutation(gql`
    mutation editUser($id: ID!, $user: UserInput!) {
      editUser(id: $id, user: $user) {
        id
        name
        email
      }
    }
  `, { onError: (error) => {
    console.error('Ошибка при обновлении аккаунта:', error);
  } });

  function onClose() {
    router.push('/admin/accounts');
  }

  async function handleUpdate() {
    await editUser({
      variables: {
        id,
        user: formData,
      },
    });
    onClose();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Typography variant="h4">Редактировать аккаунт</Typography>

      <form
        className="p-4"
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          handleUpdate();
          onClose();
        }}
      >
        <div>
          <div className="grid p-2 grid-cols-2 gap-4">

            <TextField
              label="Имя"
              fullWidth
              value={formData.name}
              required
              onChange={(e) => setFormData({
                ...formData,
                name: e.target.value,
              })}
              slotProps={{
                htmlInput: { maxLength: 255 },
              }}
            />
            <TextField
              label="email"
              fullWidth
              value={formData.email}
              required
              onChange={(e) => setFormData({
                ...formData,
                email: e.target.value,
              })}
              slotProps={{
                htmlInput: { maxLength: 255 },
              }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outlined" onClick={() => onClose()}>
            Отмена
          </Button>
          <Button variant="contained" type="submit">
            Обновить
          </Button>
        </div>
      </form>
    </div>
  );
}
