import { useState, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { Button, TextField, MenuItem, Typography } from '@mui/material';
import { Editor } from '@monaco-editor/react';
import { useSnackbar } from 'notistack';
import { IBotButton, BotButtonType } from '@/components/entities/IBotButton';

const GET_BOT_BUTTONS = gql`
  query GetBot($id: ID!) {
    getBot(id: $id) {
      id
      name
      buttons {
        id
        botId
        botItemId
        title
        type
        targetBotItemId
        targetTriggerId
        targetTrigger {
          serverScript {
            code
          }
        }
      }
    }
  }
`;

const CREATE_BOT_BUTTON = gql`
  mutation CreateBotButton($input: BotButtonInput! $triggerCode: String) {
    createBotButton(input: $input triggerCode: $triggerCode) {
      id
      title
      type
      targetBotItemId
      targetTriggerId
    }
  }
`;

const EDIT_BOT_BUTTON = gql`
  mutation EditBotButton($id: ID! $input: BotButtonInput! $triggerCode: String) {
    editBotButton(id: $id input: $input triggerCode: $triggerCode) {
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

interface BotItem {
  id: string;
  title: string;
}

interface AddButtonComponentProps {
  botId: string;
  botItems: BotItem[];
}

function AddButtonComponent({ botId, botItems }: AddButtonComponentProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [createBotButton] = useMutation(CREATE_BOT_BUTTON);
  const [editBotButton] = useMutation(EDIT_BOT_BUTTON);
  const [deleteBotButton] = useMutation(DELETE_BOT_BUTTON);
  const [buttons, setButtons] = useState<Partial<IBotButton & { triggerCode: string }>[]>([]);

  // Запрос для загрузки существующих кнопок
  const { data, loading, error } = useQuery(GET_BOT_BUTTONS, {
    variables: { id: botId },
    skip: !botId,
  });

  // Инициализация кнопок при загрузке данных
  useEffect(() => {
    if (data && data.getBot && data.getBot.buttons) {
      setButtons(
        data.getBot.buttons.map((button: any) => ({
          id: button.id,
          title: button.title,
          type: button.type,
          targetBotItemId: button.targetBotItemId,
          triggerCode: button.targetTrigger?.serverScript?.code || '',
        })),
      );
    }
  }, [data]);

  const handleButtonChange = (index: number, field: string, value: any) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setButtons(newButtons);
  };

  const handleAddNewButton = () => {
    setButtons([
      ...buttons,
      {
        title: '',
        type: BotButtonType.BotItem, // Используем значение из перечисления
        botItemId: '', // Обязательное поле
        targetBotItemId: undefined,
        triggerCode: '',
      },
    ]);
  };

  const handleSaveButton = async (index: number) => {
    const button = buttons[index];
    try {
      if (!button.id) {
        // Создание новой кнопки
        const res = await createBotButton({
          variables: {
            input: {
              title: button.title,
              type: button.type,
              targetBotItemId: button.targetBotItemId,
              botId,
            },
            triggerCode: button.triggerCode,
          },
        });
        const newButtons = [...buttons];
        newButtons[index] = {
          ...newButtons[index],
          id: res.data.createBotButton.id,
          targetBotItemId: res.data.createBotButton.targetBotItemId,
          type: res.data.createBotButton.type,
          title: res.data.createBotButton.title,
        };
        setButtons(newButtons);
        enqueueSnackbar('Кнопка успешно создана', { variant: 'success' });
      } else {
        // Редактирование существующей кнопки
        await editBotButton({
          variables: {
            id: button.id,
            input: {
              title: button.title,
              type: button.type,
              targetBotItemId: button.targetBotItemId,
            },
            triggerCode: button.triggerCode,
          },
        });
        enqueueSnackbar('Кнопка успешно отредактирована', { variant: 'success' });
      }
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Ошибка при сохранении кнопки', { variant: 'error' });
    }
  };

  const handleDeleteButton = async (_id: string) => {
    const button = buttons.find((b) => b.id === _id);
    if (button?.id) {
      try {
        await deleteBotButton({ variables: { id: button.id } });
        enqueueSnackbar('Кнопка успешно удалена', { variant: 'success' });
      } catch (err) {
        console.error(err);
        enqueueSnackbar('Ошибка при удалении кнопки', { variant: 'error' });
        return;
      }
    }
    const newButtons = buttons.filter((b) => b.id !== _id);
    setButtons(newButtons);
  };

  if (loading) return <p>Загрузка кнопок...</p>;
  if (error) return <p>Ошибка загрузки кнопок</p>;

  return (
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
            select
          >
            <MenuItem value="botItem">Переход</MenuItem>
            <MenuItem value="trigger">Триггер</MenuItem>
          </TextField>
          {button.type === 'botItem' && (
            <TextField
              label="На страницу"
              value={button.targetBotItemId}
              onChange={(e) => handleButtonChange(index, 'targetBotItemId', e.target.value)}
              fullWidth
              className="mb-2"
              select
            >
              {botItems?.map((item: { id: string; title: string }) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.title}
                </MenuItem>
              ))}
            </TextField>
          )}
          {button.type === 'trigger' && (
            <Editor
              height={200}
              defaultLanguage="javascript"
              value={button.triggerCode}
              onChange={(value) => handleButtonChange(index, 'triggerCode', value!)}
            />
          )}
          <TextField
            label="ID"
            value={button.id || 'Не задан'}
            fullWidth
            className="mb-2 mt-2"
            disabled
          />
          <div className="flex gap-2">
            <Button variant="outlined" color="error" onClick={() => handleDeleteButton(button.id!)}>
              Удалить кнопку
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleSaveButton(index)}
            >
              {button.id ? 'Редактировать кнопку' : 'Сохранить кнопку'}
            </Button>
          </div>
        </div>
      ))}
      <Button variant="contained" onClick={handleAddNewButton}>
        Добавить кнопку
      </Button>
    </div>
  );
}

export default AddButtonComponent;
