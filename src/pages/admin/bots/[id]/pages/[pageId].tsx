import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PAGE_QUERY, EDIT_PAGE_MUTATION } from '../../../../../graphql/Bot';

export default function EditPage() {
  const router = useRouter();
  const { id, pageId } = router.query;
  const { data, loading, error } = useQuery(GET_PAGE_QUERY, { variables: { id: pageId } });

  const [editPage] = useMutation(EDIT_PAGE_MUTATION);

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
      title: formData.get('title'),
    };

    await editPage({ variables: { id: pageId, input } });
    router.push(`/admin/bots/${id}/pages`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Редактировать страницу</h1>
      <input type="text" name="title" defaultValue={data.getPage.title} />
      <button type="submit">Сохранить изменения</button>
    </form>
  );
}
