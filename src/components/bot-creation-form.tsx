// import { useState } from 'react';
// import { gql, useMutation } from '@apollo/client';

// const CREATE_BOT_MUTATION = gql`
// mutation CreateBot($input: BotInput!) {
//     createBot(input: $input) {
//      id
//      name
//      title
//      favicon
//      url
//      apiKey
//      platformID
//      idInPlatform
//      clientId
//     }
// }
// `;

// function BotCreationForm({ open, onClose, onSuccess }) {
// const [formData, setFormData] = useState({
//     name: '',
//     title: '',
//     favicon: '',
//     url: '',
//     apiKey: '',
//     platformID: '',
//     idInPlatform: '',
//     clientId: '',
// })

// const [createBot, { loading, error }] = useMutation(CREATE_BOT_MUTATION)

// const handleChange = (e) => {
//     const { name, value } = e.target
//     setFormData((prevData) => ({ ...prevData, [name]: value }))
// }

// const handleSubmit = async (e) => {
//     e.preventDefault()
//     try {
//      await createBot({ variables: { input: formData } })
//      onSuccess()
//     } catch (err) {
//      console.error('Ошибка при создании бота:', err)
//     }
// };

// return (
//     open && (
//      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//         <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full">
//          <h2 className="text-2xl font-bold mb-4">Создать нового бота</h2>
//          <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//              <label className="block text-sm font-medium text-gray-700">Логин бота</label>
//              <input
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
//                 placeholder="Логин бота"
//              />
//             </div>
//             <div>
//              <label className="block text-sm font-medium text-gray-700">Имя бота</label>
//              <input
//                 name="title"
//                 value={formData.title}
//                 onChange={handleChange}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
//                 placeholder="Имя бота"
//              />
//             </div>
//             <div>
//              <label className="block text-sm font-medium text-gray-700">URL иконки</label>
//              <input
//                 name="favicon"
//                 value={formData.favicon}
//                 onChange={handleChange}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
//                 placeholder="URL иконки"
//              />
//             </div>
//             <div>
//              <label className="block text-sm font-medium text-gray-700">URL бота</label>
//              <input
//                 name="url"
//                 value={formData.url}
//                 onChange={handleChange}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
//                 placeholder="URL бота"
//              />
//             </div>
//             <div>
//              <label className="block text-sm font-medium text-gray-700">API ключ</label>
//              <input
//                 name="apiKey"
//                 value={formData.apiKey}
//                 onChange={handleChange}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
//                 placeholder="API ключ"
//              />
//             </div>
//             <div>
//              <label className="block text-sm font-medium text-gray-700">ID платформы</label>
//              <input
//                 name="platformID"
//                 value={formData.platformID}
//                 onChange={handleChange}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
//                 placeholder="ID платформы"
//              />
//             </div>
//             <div>
//              <label className="block text-sm font-medium text-gray-700">ID в платформе</label>
//              <input
//                 name="idInPlatform"
//                 value={formData.idInPlatform}
//                 onChange={handleChange}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
//                 placeholder="ID в платформе"
//              />
//             </div>
//             <div>
//              <label className="block text-sm font-medium text-gray-700">ID клиента</label>
//              <input
//                 name="clientId"
//                 value={formData.clientId}
//                 onChange={handleChange}
//                 className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
//                 placeholder="ID клиента"
//              />
//             </div>
//             <div className="flex justify-end space-x-4">
//              <button
//                 type="button"
//                 onClick={onClose}
//                 className="bg-gray-500 text-white font-bold py-2 px-4 rounded hover:bg-gray-600"
//              >
//                 Отмена
//              </button>
//              <button
//                 type="submit"
//                 disabled={loading}
//                 className="bg-green-500 text-white font-bold py-2 px-4 rounded hover:bg-green-600"
//              >
//                 Создать
//              </button>
//             </div>
//             {error && <p className="text-red-500">Ошибка: {error.message}</p>}
//          </form>
//         </div>
//      </div>
//     )
// )
// }

// export default BotCreationForm