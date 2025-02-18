import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { GET_BOT_PAGES_QUERY } from '../../../../graphql/Bot';

export default function BotPagesList() {
  const router = useRouter();
  const { id } = router.query;
  const { data, loading, error } = useQuery(GET_BOT_PAGES_QUERY, { variables: { botId: id } });

  if (loading) return <p>Loading...</p>;
  if (error) {
    return (<p>
      Error:
      {error.message}
            </p>);
  }

  return (
    <div>
      <h1>Страницы бота</h1>
      <ul>
        {data.pages.map((page) => (
          <li key={page.id}>
            {page.title}
            <button onClick={() => router.push(`/admin/bots/${id}/pages/${page.id}`)}>Редактировать</button>
          </li>
        ))}
      </ul>
      <button onClick={() => router.push(`/admin/bots/${id}/pages/new`)}>Добавить страницу</button>
    </div>
  );
}
