import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Typography,
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
        botItemId
        targetBotItemId
        targetTriggerId
      }
    }
  }
`;

const EDIT_BOT_ITEM = gql`
  mutation EditBotItem($id: ID!, $input: BotItemInput!) {
    editBotItem(id: $id, input: $input) {
      id
      isStart
      title
      content
      filterScript
      type
      tableViewId
      tableRowId
      botId
    }
  }
`;

const CREATE_BOT_BUTTON = gql`
  mutation CreateBotButton($input: BotButtonInput!) {
    createBotButton(input: $input) {
      id
      title
      type
      botItemId
      targetBotItemId
      targetTriggerId
    }
  }
`;

const EDIT_BOT_BUTTON = gql`
  mutation EditBotButton($id: ID!, $input: BotButtonInput!) {
    editBotButton(id: $id, input: $input) {
      id
      title
      type
      botItemId
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

function EditBotPage() {
  const router = useRouter();
  const { pageId: id } = router.query;

  const { enqueueSnackbar } = useSnackbar();

  const { data, loading, error } = useQuery(GET_BOT_ITEM, {
    variables: { id },
    skip: !id,
  });

  const [editBotItem] = useMutation(EDIT_BOT_ITEM);
  const [createBotButton] = useMutation(CREATE_BOT_BUTTON);
  const [editBotButton] = useMutation(EDIT_BOT_BUTTON);
  const [deleteBotButton] = useMutation(DELETE_BOT_BUTTON);

  const [botItem, setBotItem] = useState({
    isStart: false,
    title: null,
    content: null,
    filterScript: null,
    type: null,
    tableViewId: null,
    tableRowId: null,
    botId: null,
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type, checked } = e.target;
    setBotItem((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await editBotItem({
        variables: {
          id,
          input: botItem,
        },
      });
      enqueueSnackbar('Страница успешно изменена', { variant: 'success' });
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Ошибка при изменении страницы', { variant: 'error' });
    }
  };

  const handleButtonChange = (index: number, field: string, value: string) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setButtons(newButtons);
  };

  const handleSaveButton = async (index: number) => {
    const button = buttons[index];
    if (button.id) {
      try {
        await editBotButton({
          variables: {
            id: button.id,
            input: {
              title: button.title,
              type: button.type,
              botItemId: id,
              targetBotItemId: button.targetBotItemId,
              targetTriggerId: button.targetTriggerId,
            },
          },
        });
        enqueueSnackbar('Кнопка успешно изменена', { variant: 'success' });
      } catch (err) {
        console.error(err);
        enqueueSnackbar('Ошибка при изменении кнопки', { variant: 'error' });
      }
    } else {
      try {
        const res = await createBotButton({
          variables: {
            input: {
              title: button.title,
              type: button.type,
              botItemId: id,
              targetBotItemId: button.targetBotItemId,
              targetTriggerId: button.targetTriggerId,
            },
          },
        });
        const newButton = res.data.createBotButton;
        const newButtons = [...buttons];
        newButtons[index] = newButton;
        setButtons(newButtons);
        enqueueSnackbar('Кнопка успешно создана', { variant: 'success' });
      } catch (err) {
        console.error(err);
        enqueueSnackbar('Ошибка при создании кнопки', { variant: 'error' });
      }
    }
  };

  const handleDeleteButton = async (index: number) => {
    const button = buttons[index];
    if (button.id) {
      try {
        await deleteBotButton({
          variables: {
            id: button.id,
          },
        });
        const newButtons = buttons.filter((_, i) => i !== index);
        setButtons(newButtons);
        enqueueSnackbar('Кнопка успешно удалена', { variant: 'success' });
      } catch (err) {
        console.error(err);
        enqueueSnackbar('Ошибка при удалении кнопки', { variant: 'error' });
      }
    } else {
      const newButtons = buttons.filter((_, i) => i !== index);
      setButtons(newButtons);
    }
  };

  const handleAddNewButton = () => {
    setButtons([...buttons, { title: null, type: null, targetBotItemId: null, targetTriggerId: null }]);
  };

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Typography variant="h5" gutterBottom>
        Редактировать страницу бота
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
        <TextField
          label="Title"
          name="title"
          value={botItem.title}
          onChange={handleInputChange}
          fullWidth
        />
        <TextField
          label="Content"
          name="content"
          value={botItem.content}
          onChange={handleInputChange}
          fullWidth
          multiline
          rows={4}
        />
        <TextField
          label="Фильтр-скрипт"
          name="filterScript"
          value={botItem.filterScript}
          onChange={handleInputChange}
          fullWidth
        />
        <TextField
          label="Тип"
          name="type"
          value={botItem.type}
          onChange={handleInputChange}
          fullWidth
        />
        <TextField
          label="tableViewId"
          name="tableViewId"
          value={botItem.tableViewId}
          onChange={handleInputChange}
          fullWidth
        />
        <TextField
          label="tableRowId"
          name="tableRowId"
          value={botItem.tableRowId}
          onChange={handleInputChange}
          fullWidth
        />
        <Button variant="contained" color="primary" type="submit">
          Сохранить
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
              label="target id"
              value={button.targetBotItemId}
              onChange={(e) => handleButtonChange(index, 'targetBotItemId', e.target.value)}
              fullWidth
              className="mb-2"
            />
            <TextField
              label="target trigger id"
              value={button.targetTriggerId}
              onChange={(e) => handleButtonChange(index, 'targetTriggerId', e.target.value)}
              fullWidth
              className="mb-2"
            />
            <div className="flex space-x-2">
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleSaveButton(index)}
              >
                Save Button
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleDeleteButton(index)}
              >
                Удалить кнопку
              </Button>
            </div>
          </div>
        ))}
        <Button variant="contained" onClick={handleAddNewButton}>
          Добавить кнопку
        </Button>
      </div>
    </div>
  );
}

export default EditBotPage;
