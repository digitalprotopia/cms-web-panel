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
    <div className="h-fit p-6 bg-white rounded shadow-lg">
      <div className="flex flex-col gap-4 items-start">
        <Button
          variant="contained"
          sx={{ width: 'fit-content' }}
          onClick={async () => {
            await repairTables();
            enqueueSnackbar('Таблицы починены', { variant: 'success' });
          }}
        >
          Починить таблицы
        </Button>
        <Button
          variant="contained"
          sx={{ width: 'fit-content' }}
          onClick={async () => {
            await clearCache();
            enqueueSnackbar('Кэш очищен', { variant: 'success' });
          }}
        >
          Очистить кэш
        </Button>
        <Button
          variant="contained"
          sx={{ width: 'fit-content' }}
          onClick={async () => {
            await restartGraphql();
            enqueueSnackbar('GraphQL перезапущен', { variant: 'success' });
          }}
        >
          Перезапустить GraphQL
        </Button>
      </div>
    </div>
  );
}
