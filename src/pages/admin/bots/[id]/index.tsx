import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { useSnackbar } from 'notistack';

const GET_BOT = gql`
  query GetBot($id: ID!) {
    getBot(id: $id) {
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

const GET_BOT_ITEMS = gql`
  query GetBotItems($id: ID!) {
    getBotItems(id: $id) {
      id
      title
      type
    }
  }
`;

const EDIT_BOT = gql`
  mutation EditBot($id: ID!, $input: BotInput!) {
    editBot(id: $id, input: $input) {
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

const DELETE_BOT_ITEM = gql`
  mutation DeleteBotItem($id: ID!) {
    deleteBotItem(id: $id)
  }
`;

function EditBotPage() {
  const router = useRouter();
  const { id } = router.query;

  const { enqueueSnackbar } = useSnackbar();

  const { data, loading, error } = useQuery(GET_BOT, {
    variables: { id },
    skip: !id,
  });

  const { data: itemsData, refetch: refetchItems } = useQuery(GET_BOT_ITEMS, {
    variables: { id },
    skip: !id,
  });

  const [editBot] = useMutation(EDIT_BOT);
  const [deleteBotItem] = useMutation(DELETE_BOT_ITEM);

  const [bot, setBot] = useState({
    name: null,
    title: null,
    favicon: null,
    url: null,
    apiKey: null,
    platformID: null,
    idInPlatform: null,
    clientId: null,
  });

  useEffect(() => {
    if (data && data.getBot) {
      setBot({
        name: data.getBot.name || null,
        title: data.getBot.title || null,
        favicon: data.getBot.favicon || null,
        url: data.getBot.url || null,
        apiKey: data.getBot.apiKey || null,
        platformID: data.getBot.platformID || null,
        idInPlatform: data.getBot.idInPlatform || null,
        clientId: data.getBot.clientId || null,
      });
    }
  }, [data]);

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p>Ошибка загрузки бота</p>;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBot((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await editBot({
        variables: {
          id,
          input: bot,
        },
      });
      enqueueSnackbar('Данные успешно изменены', { variant: 'success' });
    } catch (err) {
      console.error(err);
      enqueueSnackbar('При редактировании возникла непредвиденная ошибка', { variant: 'success' });
    }
  };

  const handleDeleteBotItem = async (botItemId: string) => {
    try {
      await deleteBotItem({ variables: { id: botItemId } });
      refetchItems();
      enqueueSnackbar('Успешное удаление страницы бота', { variant: 'success' });
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Ошибка при удалении страницы бота', { variant: 'error' });
    }
  };

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Typography variant="h5" gutterBottom>
        Редактирование бота
      </Typography>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Имя"
          name="name"
          value={bot.name}
          onChange={handleInputChange}
          fullWidth
        />
        <TextField
          label="Название"
          name="title"
          value={bot.title}
          onChange={handleInputChange}
          fullWidth
        />
        <TextField
          label="Favicon"
          name="favicon"
          value={bot.favicon}
          onChange={handleInputChange}
          fullWidth
        />
        <TextField
          label="URL"
          name="url"
          value={bot.url}
          onChange={handleInputChange}
          fullWidth
        />
        <TextField
          label="API ключ"
          name="apiKey"
          value={bot.apiKey}
          onChange={handleInputChange}
          fullWidth
        />
        <TextField
          label="Platform ID"
          name="platformID"
          value={bot.platformID}
          onChange={handleInputChange}
          fullWidth
        />
        <TextField
          label="ID in Platform"
          name="idInPlatform"
          value={bot.idInPlatform}
          onChange={handleInputChange}
          fullWidth
        />
        <TextField
          label="Client ID"
          name="clientId"
          value={bot.clientId}
          onChange={handleInputChange}
          fullWidth
        />
        <Button variant="contained" color="primary" type="submit">
          Сохранить
        </Button>
      </form>

      <div className="mt-8">
        <Typography variant="h6" gutterBottom>
          Страницы
        </Typography>
        <List>
          {itemsData?.getBotItems?.map((item: any) => (
            <ListItem key={item.id} className="border rounded mb-2">
              <ListItemText
                primary={item.title}
                secondary={`Тип: ${item.type}`}
              />
              <IconButton
                color="primary"
                onClick={() => router.push(`${id}/pages/${item.id}`)}
              >
                <Edit />
              </IconButton>
              <IconButton
                color="error"
                onClick={() => handleDeleteBotItem(item.id)}
              >
                <Delete />
              </IconButton>
            </ListItem>
          ))}
        </List>
        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push(`${id}/pages/create`)}
        >
          Добавить страницу
        </Button>
      </div>
    </div>
  );
}

export default EditBotPage;
