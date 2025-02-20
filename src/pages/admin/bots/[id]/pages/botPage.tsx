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
import { Editor } from '@monaco-editor/react';
import Link from 'next/link';
import { BotButtonType, IBotButton } from '@/components/entities/IBotButton';
import { BotItemType, IBotItem } from '@/components/entities/IBotItem';
import { ITable } from '@/components/entities/ITable';

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
      tableView {
        tableId
      }
      tableRowId
      botId
      buttons {
        id
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

const GET_BOT_ITEMS = gql`
  query GetBotItems($botId: ID!) {
    getBot(id: $botId) {
      id
      title
    }
    getBotItems(id: $botId) {
      id
      title
    }
    getTables {
      id
      name
    }
}
`;

const CREATE_BOT_ITEM = gql`
  mutation CreateBotItem($input: BotItemInput! $tableId: ID) {
    createBotItem(input: $input tableId: $tableId) {
      id
    }
  }
`;

const EDIT_BOT_ITEM = gql`
  mutation EditBotItem($id: ID!, $input: BotItemInput! $tableId: ID) {
    editBotItem(id: $id, input: $input, tableId: $tableId) {
      id
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

function BotPage() {
  const router = useRouter();
  const { pageId: id, id: botId } = router.query;
  const { enqueueSnackbar } = useSnackbar();

  const { data, loading, refetch } = useQuery(GET_BOT_ITEM, {
    variables: { id },
    skip: !id,
  });

  const botItems = useQuery(GET_BOT_ITEMS, {
    variables: { botId },
  });

  const [createBotItem] = useMutation(CREATE_BOT_ITEM);
  const [editBotItem] = useMutation(EDIT_BOT_ITEM);
  const [createBotButton] = useMutation(CREATE_BOT_BUTTON);
  const [editBotButton] = useMutation(EDIT_BOT_BUTTON);
  const [deleteBotButton] = useMutation(DELETE_BOT_BUTTON);

  const [botItem, setBotItem] = useState<Partial<IBotItem & { tableId: string }>>({
    isStart: false,
    title: '',
    content: '',
    filterScript: undefined,
    type: BotItemType.Static,
    tableId: undefined,
    tableRowId: undefined,
    botId: botId as string,
  });

  const [buttons, setButtons] = useState<Partial<IBotButton & { triggerCode: string }>[]>([]);

  useEffect(() => {
    if (data && data.getBotItem) {
      const fetched = data.getBotItem;
      setBotItem({
        isStart: fetched.isStart || false,
        title: fetched.title || null,
        content: fetched.content || null,
        filterScript: fetched.filterScript || null,
        type: fetched.type || null,
        tableId: fetched.tableView?.tableId || null,
        tableRowId: fetched.tableRowId || null,
        botId: fetched.botId || null,
      });
      setButtons(fetched.buttons?.map((button: IBotButton) => ({
        id: button.id,
        title: button.title,
        type: button.type,
        targetBotItemId: button.targetBotItemId,
        triggerCode: (button as any).targetTrigger?.serverScript?.code || '',
      })
         || []));
    }
  }, [data]);

  if (loading) return <p>Loading...</p>;
  // if (error) return <p>Error loading bot item.</p>;

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
        const res = await createBotItem({ variables: {
          input: {
            title: botItem.title,
            content: botItem.content,
            filterScript: botItem.filterScript,
            type: botItem.type,
          },
          tableId: botItem.tableId,
        } });
        newPageId = res.data.createBotItem.id;
      } else {
        await editBotItem({ variables: { id,
          input: {
            title: botItem.title,
            content: botItem.content,
            filterScript: botItem.filterScript,
            type: botItem.type,
          },
          tableId: botItem.tableId } });
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const button of buttons) {
        if (!button.id) {
          console.log(button);
          // eslint-disable-next-line no-await-in-loop
          await createBotButton({
            variables: {
              input: {
                title: button.title,
                type: button.type,
                targetBotItemId: button.targetBotItemId,
                botItemId: newPageId,
              },
              triggerCode: button.triggerCode,
            },
          });
        } else {
          // eslint-disable-next-line no-await-in-loop
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
        }
      }

      refetch();

      if (!id) {
        router.push(`/admin/bots/${botId}/pages/${newPageId}`);
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
    setButtons([...buttons, { title: '', type: BotButtonType.BotItem, targetBotItemId: undefined, triggerCode: '' }]);
  };

  const handleDeleteButton = async (_id: string) => {
    const button = buttons.find((b) => b.id === _id);
    if (button!.id) {
      try {
        await deleteBotButton({ variables: { id: button!.id } });
        enqueueSnackbar('Кнопка успешно удалена', { variant: 'success' });
      } catch (err) {
        console.error(err);
        enqueueSnackbar('Ошибка при удалении кнопки', { variant: 'error' });
        return;
      }
    } else {
      enqueueSnackbar('Кнопка удалена', { variant: 'success' });
    }
    const newButtons = buttons.filter((b) => b.id !== _id);
    setButtons(newButtons);
  };

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Typography variant="h5" gutterBottom>
        {id ? 'Редактировать' : 'Создать'}
        {' '}
        страницу бота
        {' '}
        <Link href={`/admin/bots/${botId}`}>{botItems.data?.getBot.title}</Link>
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
        {botItem.type === 'list' && (
          <TextField
            label="Таблица"
            name="tableId"
            value={botItem.tableId}
            onChange={handleInputChange}
            fullWidth
            select
          >
            {botItems.data?.getTables.map((table: ITable) => (
              <MenuItem key={table.id} value={table.id}>
                {table.name}
              </MenuItem>
            ))}
          </TextField>
        )}
        {/* <TextField label="tableRowId" name="tableRowId"
        value={botItem.tableRowId} onChange={handleInputChange} fullWidth /> */}
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
                {botItems.data?.getBotItems.map((item: IBotItem) => (
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
            <Button variant="outlined" color="error" onClick={() => handleDeleteButton(button.id!)}>
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
