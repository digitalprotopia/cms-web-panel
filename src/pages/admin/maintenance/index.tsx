import { gql, useMutation } from '@apollo/client';
import { Button } from '@mui/material';
import { useSnackbar } from 'notistack';

export default function Maintenance() {
  const { enqueueSnackbar } = useSnackbar();

  const [repairTables] = useMutation(gql`
    mutation {
      repairTables
    }
  `);

  const [clearCache] = useMutation(gql`
    mutation {
      clearCache
    }
  `);

  const [restartGraphql] = useMutation(gql`
    mutation {
      restartGraphql
    }
  `);

  return (
    <>
      <Button
        variant="contained"
        onClick={async () => {
          await repairTables();
          enqueueSnackbar('Таблицы починены', { variant: 'success' });
        }}
      >
        Починить таблицы
      </Button>
      <Button
        variant="contained"
        onClick={async () => {
          await clearCache();
          enqueueSnackbar('Кэш очищен', { variant: 'success' });
        }}
      >
        Очистить кэш
      </Button>
      <Button
        variant="contained"
        onClick={async () => {
          await restartGraphql();
          enqueueSnackbar('GraphQL перезапущен', { variant: 'success' });
        }}
      >
        Перезапустить GraphQL
      </Button>
    </>
  );
}
