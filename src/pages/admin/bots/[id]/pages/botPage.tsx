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
import FileDialog from '@/components/FileDialog';

const GET_BOT_ITEMS = gql`
query GetBotItemsAndUsers($botId: ID!) {
    getBot(id: $botId) {
     id
     title
    }
    getBotItems(id: $botId) {
     id
     title
    }
    getUsers {
     id
     name
     role {
        name
     }
    }
    getTables {
     id
     name
    }
    getPosts {
     title
     content
    }
    getCategories {
     title
    }
    getTags {
     title
    }
    getAllWidgets {
     title
    }
    getAllForms {
     title
    }
    getAllSites {
     title
    }
}
`;

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
     fileId
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

const { data: botItemsData, loading: botItemsLoading } = useQuery(GET_BOT_ITEMS, {
    variables: { botId },
});

const [createBotItem] = useMutation(CREATE_BOT_ITEM);
const [editBotItem] = useMutation(EDIT_BOT_ITEM);
const [createBotButton] = useMutation(CREATE_BOT_BUTTON);
const [editBotButton] = useMutation(EDIT_BOT_BUTTON);
const [deleteBotButton] = useMutation(DELETE_BOT_BUTTON);

const [botItem, setBotItem] = useState<Partial<IBotItem & { tableId: string, userId: string, postId: string, categoryId: string, tagId: string, widgetId: string, formId: string, siteId: string }>>({
    isStart: false,
    title: '',
    content: '',
    filterScript: undefined,
    type: BotItemType.Static,
    tableId: undefined,
    tableRowId: undefined,
    botId: botId as string,
    fileId: undefined,
    userId: undefined,
    postId: undefined,
    categoryId: undefined,
    tagId: undefined,
    widgetId: undefined,
    formId: undefined,
    siteId: undefined,
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
        fileId: fetched.fileId || null,
        userId: fetched.userId || null,
        postId: fetched.postId || null,
        categoryId: fetched.categoryId || null,
        tagId: fetched.tagId || null,
        widgetId: fetched.widgetId || null,
        formId: fetched.formId || null,
        siteId: fetched.siteId || null,
     });
     setButtons(fetched.buttons?.map((button: IBotButton) => ({
        id: button.id,
        title: button.title,
        type: button.type,
        targetBotItemId: button.targetBotItemId,
        triggerCode: (button as any).targetTrigger?.serverScript?.code || '',
     }))
     || []);
    }
}, [data]);

if (loading || botItemsLoading) return <p>Loading...</p>;

const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setBotItem((prev) => ({
     ...prev,
     [name]: type === 'checkbox' ? checked : value,
    }));
};

const handleSubmit = async (e: any) => {
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
            isStart: botItem.isStart,
            botId,
            fileId: botItem.fileId,
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
            isStart: botItem.isStart,
            fileId: botItem.fileId,
         },
         tableId: botItem.tableId } });
     }

     for (const button of buttons) {
        if (!button.id) {
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
        <Link href={`/admin/bots/${botId}`}>{botItemsData?.getBot.title}</Link>
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
         <>
            <TextField
             label="Таблица"
             name="tableId"
             value={botItem.tableId}
             onChange={handleInputChange}
             fullWidth
             select
            >
             {botItemsData?.getTables.map((table: ITable) => (
                <MenuItem key={table.id} value={table.id}>
                 {table.name}
                </MenuItem>
             ))}
            </TextField>
            <TextField
             label="Аккаунты"
             name="userId"
             value={botItem.userId}
             onChange={handleInputChange}
             fullWidth
             select
            >
             {botItemsData?.getUsers.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                 {user.name} ({user.role.name})
                </MenuItem>
             ))}
            </TextField>
            <TextField
             label="Записи"
             name="postId"
             value={botItem.postId}
             onChange={handleInputChange}
             fullWidth
             select
            >
             {botItemsData?.getPosts.map((post, index) => (
                <MenuItem key={index} value={post.title}>
                 {post.title}
                </MenuItem>
             ))}
            </TextField>
            <TextField
             label="Категории"
             name="categoryId"
             value={botItem.categoryId}
             onChange={handleInputChange}
             fullWidth
             select
            >
             {botItemsData?.getCategories.map((category, index) => (
                <MenuItem key={index} value={category.title}>
                 {category.title}
                </MenuItem>
             ))}
            </TextField>
            <TextField
             label="Теги"
             name="tagId"
             value={botItem.tagId}
             onChange={handleInputChange}
             fullWidth
             select
            >
             {botItemsData?.getTags.map((tag, index) => (
                <MenuItem key={index} value={tag.title}>
                 {tag.title}
                </MenuItem>
             ))}
            </TextField>
            <TextField
             label="Виджеты"
             name="widgetId"
             value={botItem.widgetId}
             onChange={handleInputChange}
             fullWidth
             select
            >
             {botItemsData?.getAllWidgets.map((widget, index) => (
                <MenuItem key={index} value={widget.title}>
                 {widget.title}
                </MenuItem>
             ))}
            </TextField>
            <TextField
             label="Формы"
             name="formId"
             value={botItem.formId}
             onChange={handleInputChange}
             fullWidth
             select
            >
             {botItemsData?.getAllForms.map((form, index) => (
                <MenuItem key={index} value={form.title}>
                 {form.title}
                </MenuItem>
             ))}
            </TextField>
            <TextField
             label="Сайты"
             name="siteId"
             value={botItem.siteId}
             onChange={handleInputChange}
             fullWidth
             select
            >
             {botItemsData?.getAllSites.map((site, index) => (
                <MenuItem key={index} value={site.title}>
                 {site.title}
                </MenuItem>
             ))}
            </TextField>
         </>
        )}
        <FileDialog
         fileId={botItem.fileId}
         onChange={(fileId) => setBotItem((prev) => ({ ...prev, fileId }))}
        />
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
                {botItemsData?.getBotItems.map((item: IBotItem) => (
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
