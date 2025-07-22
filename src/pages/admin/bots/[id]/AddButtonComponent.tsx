import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Button, TextField, MenuItem, Typography } from '@mui/material';
import { Editor } from '@monaco-editor/react';
import { useSnackbar } from 'notistack';
import { IBotButton } from '@/components/entities/IBotButton';

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

const DELETE_BOT_BUTTON = gql`
  mutation DeleteBotButton($id: ID!) {
    deleteBotButton(id: $id)
  }
`;

function AddButtonComponent({ botId, botItems }) {
  const { enqueueSnackbar } = useSnackbar();
  const [createBotButton] = useMutation(CREATE_BOT_BUTTON);
  const [deleteBotButton] = useMutation(DELETE_BOT_BUTTON);
  const [buttons, setButtons] = useState<Partial<IBotButton & { triggerCode: string }>[]>([]);

  const handleButtonChange = (index: number, field: string, value: any) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setButtons(newButtons);
  };

  const handleAddNewButton = () => {
    setButtons([...buttons, { title: '', type: 'botItem', targetBotItemId: undefined, triggerCode: '' }]);
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
          <Button variant="outlined" color="error" onClick={() => handleDeleteButton(button.id!)}>
            Удалить кнопку
          </Button>
        </div>
      ))}
      <Button variant="contained" onClick={handleAddNewButton}>
        Добавить кнопку
      </Button>
    </div>
  );
}

export default AddButtonComponent;
