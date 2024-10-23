import { gql, useQuery } from '@apollo/client';
import { Button } from '@mui/material';
import { useRouter } from 'next/router';

export default function Templates() {
  const router = useRouter();

  const { data, loading, error } = useQuery(gql`
    query($dbName: String!) {
      getTableByDbName(dbName: $dbName) {
        id
        name
        templates {
          id
          title
        }
      }
    }
  `, {
    variables: {
      dbName: router.query['table-id'],
    },
  });

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Templates</h2>
      <ul>
        {data.getTableByDbName.templates.map((template) => (
          <li key={template.id}>
            <Button onClick={() => router.push(`/admin/tables/${router.query['table-id']}/templates/${template.id}`)}>{template.title}</Button>
          </li>
        ))}
      </ul>
      <Button onClick={() => router.push(`/admin/tables/${router.query['table-id']}/templates/add`)}>Add</Button>
    </div>
  );
}
