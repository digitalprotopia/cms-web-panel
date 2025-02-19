import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Typography,
  MenuItem,
} from '@mui/material';
import { useSnackbar } from 'notistack';

const GET_BOT_ITEM = gql`
  query GetBotItem($id: ID!) {
    getBotItem(id: $id) {
      id
      isStart
      title
      content
      filterScript
      type
      tableViewId
      tableRowId
      botId
      buttons {
        id
        title
        type
        targetBotItemId
        targetTriggerId
      }
    }
  }
`;

const CREATE_BOT_ITEM = gql`
  mutation CreateBotItem($input: BotItemInput!) {
    createBotItem(input: $input) {
      id
    }
  }
`;

const EDIT_BOT_ITEM = gql`
  mutation EditBotItem($id: ID!, $input: BotItemInput!) {
    editBotItem(id: $id, input: $input) {
      id
    }
  }
`;

const CREATE_BOT_BUTTON = gql`
  mutation CreateBotButton($input: BotButtonInput!) {
    createBotButton(input: $input) {
      id
      title
      type
      targetBotItemId
      targetTriggerId
    }
  }
`;

const DELETE_BOT_BUTTON = gql`
  mutation DeleteBotButton($id: ID!) {
    deleteBotButton(id: $id)
  }
`;

function BotPage() {
  const router = useRouter();
  const { pageId: id, id: botId } = router.query;
  const { enqueueSnackbar } = useSnackbar();

  const { data, loading, error } = useQuery(GET_BOT_ITEM, {
    variables: { id },
    skip: !id,
  });

  const [createBotItem] = useMutation(CREATE_BOT_ITEM);
  const [editBotItem] = useMutation(EDIT_BOT_ITEM);
  const [createBotButton] = useMutation(CREATE_BOT_BUTTON);
  const [deleteBotButton] = useMutation(DELETE_BOT_BUTTON);

  const [botItem, setBotItem] = useState({
    isStart: false,
    title: null,
    content: null,
    filterScript: null,
    type: null,
    tableViewId: null,
    tableRowId: null,
    botId: botId || null,
  });

  const [buttons, setButtons] = useState([]);

  useEffect(() => {
    if (data && data.getBotItem) {
      const fetched = data.getBotItem;
      setBotItem({
        isStart: fetched.isStart || false,
        title: fetched.title || null,
        content: fetched.content || null,
        filterScript: fetched.filterScript || null,
        type: fetched.type || null,
        tableViewId: fetched.tableViewId || null,
        tableRowId: fetched.tableRowId || null,
        botId: fetched.botId || null,
      });
      setButtons(fetched.buttons || []);
    }
  }, [data]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading bot item.</p>;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBotItem((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let newPageId = id;

      if (!id) {
        const res = await createBotItem({ variables: { input: botItem } });
        newPageId = res.data.createBotItem.id;
        router.push(`/bots/${botId}/pages/${newPageId}`);
      } else {
        await editBotItem({ variables: { id, input: botItem } });
      }

      for (const button of buttons) {
        if (!button.id) {
          await createBotButton({
            variables: {
              input: { ...button, botItemId: newPageId },
            },
          });
        }
      }

      enqueueSnackbar(`Страница ${id ? 'изменена' : 'создана'}`, { variant: 'success' });
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Ошибка при сохранении', { variant: 'error' });
    }
  };

  const handleButtonChange = (index: any, field: any, value: any) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setButtons(newButtons);
  };

  const handleAddNewButton = () => {
    setButtons([...buttons, { title: null, type: null, targetBotItemId: null, targetTriggerId: null }]);
  };

  const handleDeleteButton = async (index) => {
    const button = buttons[index];
    if (button.id) {
      try {
        await deleteBotButton({ variables: { id: button.id } });
        enqueueSnackbar('Кнопка успешно удалена', { variant: 'success' });
      } catch (err) {
        console.error(err);
        enqueueSnackbar('Ошибка при удалении кнопки', { variant: 'error' });
        return;
      }
    } else {
      enqueueSnackbar('Кнопка удалена', { variant: 'success' });
    }
    const newButtons = buttons.filter((_, i) => i !== index);
    setButtons(newButtons);
  };

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Typography variant="h5" gutterBottom>
        {id ? 'Редактировать' : 'Создать'}
        {' '}
        страницу бота
      </Typography>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormControlLabel
          control={
            (<Checkbox
              checked={botItem.isStart}
              onChange={handleInputChange}
              name="isStart"
            />)
          }
          label="Начальная"
        />
        <TextField label="Название" name="title" value={botItem.title} onChange={handleInputChange} fullWidth />
        <TextField label="Контент" name="content" value={botItem.content} onChange={handleInputChange} fullWidth multiline rows={4} />
        <TextField label="Фильтр-скрипт" name="filterScript" value={botItem.filterScript} onChange={handleInputChange} fullWidth />
        <TextField select label="Тип" name="type" value={botItem.type} onChange={handleInputChange} fullWidth>
          <MenuItem value="static">static</MenuItem>
          <MenuItem value="list">list</MenuItem>
          <MenuItem value="single">single</MenuItem>
        </TextField>
        <TextField label="tableViewId" name="tableViewId" value={botItem.tableViewId} onChange={handleInputChange} fullWidth />
        <TextField label="tableRowId" name="tableRowId" value={botItem.tableRowId} onChange={handleInputChange} fullWidth />
        <Button variant="contained" color="primary" type="submit">
          {id ? 'Сохранить' : 'Создать'}
        </Button>
      </form>

      <div className="mt-8">
        <Typography variant="h6" gutterBottom>
          Кнопки бота
        </Typography>
        {buttons.map((button, index) => (
          <div key={index} className="mb-4 p-4 border rounded">
            <TextField
              label="Название кнопки"
              value={button.title}
              onChange={(e) => handleButtonChange(index, 'title', e.target.value)}
              fullWidth
              className="mb-2"
            />
            <TextField
              label="Тип кнопки"
              value={button.type}
              onChange={(e) => handleButtonChange(index, 'type', e.target.value)}
              fullWidth
              className="mb-2"
            />
            <TextField
              label="targetBotItemId"
              value={button.targetBotItemId}
              onChange={(e) => handleButtonChange(index, 'targetBotItemId', e.target.value)}
              fullWidth
              className="mb-2"
            />
            <TextField
              label="targetTriggerId"
              value={button.targetTriggerId}
              onChange={(e) => handleButtonChange(index, 'targetTriggerId', e.target.value)}
              fullWidth
              className="mb-2"
            />
            <Button variant="outlined" color="error" onClick={() => handleDeleteButton(index)}>
              Удалить кнопку
            </Button>
          </div>
        ))}
        <Button variant="contained" onClick={handleAddNewButton}>
          Добавить кнопку
        </Button>
      </div>
    </div>
  );
}

export default BotPage;
