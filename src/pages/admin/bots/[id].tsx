import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@apollo/client';
import { GET_BOT_QUERY, EDIT_BOT_MUTATION } from '../../../graphql/Bot';

export default function EditBotPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data, loading, error } = useQuery(GET_BOT_QUERY, { variables: { id } });

  const [editBot] = useMutation(EDIT_BOT_MUTATION);

  if (loading) return <p>Loading...</p>;
  if (error) {
    return (<p>
      Error:
      {error.message}
            </p>);
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const input = {
      name: formData.get('name'),
      title: formData.get('title'),
    };

    await editBot({ variables: { id, input } });
    router.push('/admin/bots');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Редактировать бота</h1>
      <input type="text" name="name" defaultValue={data.getBot.name} />
      <input type="text" name="title" defaultValue={data.getBot.title} />
      <button type="submit">Сохранить изменения</button>
    </form>
  );
}
