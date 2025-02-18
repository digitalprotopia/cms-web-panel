import { useState } from 'react'
import { gql, useMutation } from '@apollo/client'
import { TextField, Button, Container, Typography, Box } from '@mui/material'
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
console.log('AddBotPage rendered')
const router = useRouter();
const [formData, setFormData] = useState({
    name: '',
    title: '',
    favicon: '',
    url: '',
    apiKey: '',
    platformID: '',
    idInPlatform: '',
    clientId: '',
});

const [createBot, { loading, error }] = useMutation(CREATE_BOT_MUTATION)

const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({ ...prevData, [name]: value }))
};

const handleSubmit = async (e) => {
    e.preventDefault()
    try {
     await createBot({ variables: { input: formData } })
     router.push('/bots')
    } catch (err) {
     console.error('Ошибка при создании бота:', err)
    }
}

return (
    <Container maxWidth="sm">
     <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
         Создать нового бота
        </Typography>
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
         <TextField
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
         />
         <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="contained" color="primary" type="submit" disabled={loading}>
             Создать
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => router.push('/bots')}>
             Отмена
            </Button>
         </Box>
         {error && <Typography color="error">Ошибка: {error.message}</Typography>}
        </form>
     </Box>
    </Container>
)
}

export default AddBotPage
