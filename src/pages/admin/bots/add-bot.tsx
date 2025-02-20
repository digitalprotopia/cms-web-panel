import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { TextField, Button, Typography, Box } from '@mui/material';
import { useRouter } from 'next/router';

const CREATE_BOT_MUTATION = gql`
  mutation CreateBot($input: BotInput!) {
    createBot(input: $input) {
      id
      name
      title
      favicon
      url
      apiKey
      platformID
      idInPlatform
      clientId
    }
  }
`;

function AddBotPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    favicon: '',
    url: '',
    apiKey: '',
    // platformID: '',
    // idInPlatform: '',
    // clientId: '',
  });

  const [createBot, { loading, error }] = useMutation(CREATE_BOT_MUTATION);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const input = Object.fromEntries(
      Object.entries(formData).filter(([, value]) => value !== ''),
    );
    try {
      await createBot({ variables: { input } });
      router.push('/admin/bots');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <div className="flex items-center justify-between gap-4">
        <Typography variant="h4" component="h1" gutterBottom>
          Создать нового бота
        </Typography>
      </div>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Логин бота"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Имя бота"
          name="title"
          value={formData.title}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          margin="normal"
          label="URL иконки"
          name="favicon"
          value={formData.favicon}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          margin="normal"
          label="URL бота"
          name="url"
          value={formData.url}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          margin="normal"
          label="API ключ"
          name="apiKey"
          value={formData.apiKey}
          onChange={handleChange}
        />
        {/* <TextField
          fullWidth
          margin="normal"
          label="ID платформы"
          name="platformID"
          value={formData.platformID}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          margin="normal"
          label="ID в платформе"
          name="idInPlatform"
          value={formData.idInPlatform}
          onChange={handleChange}
        />
        <TextField
          fullWidth
          margin="normal"
          label="ID клиента"
          name="clientId"
          value={formData.clientId}
          onChange={handleChange}
        /> */}
        <Box className="mt-2 flex justify-between">
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
          >
            Создать
          </Button>
        </Box>
        {error && (
        <Typography color="error" className="mt-2">
          Ошибка:
          {error.message}
        </Typography>
        )}
      </form>
    </div>
  );
}

export default AddBotPage;
