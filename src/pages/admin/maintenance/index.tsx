import { TemplateLanguage } from '@/components/entities/ITemplate';
import { gql, useLazyQuery, useMutation } from '@apollo/client';
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

  const [getAllWidgets] = useLazyQuery(gql`
    query {
      getAllWidgets {
        id
        title
        template {
          html
          language
        }
      }
    }
  `);

  const [precompileWidget] = useMutation(gql`
  mutation($id: ID!, $precompiled: String!) {
  precompileWidget(id: $id, precompiled: $precompiled) {
    id
    precompiled
  }
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
        <Button
          variant="contained"
          sx={{ width: 'fit-content' }}
          onClick={async () => {
            const widgets = await getAllWidgets();
            // eslint-disable-next-line guard-for-in, no-restricted-syntax
            for (const i in widgets.data.getAllWidgets) {
              try {
                const widget = widgets.data.getAllWidgets[i];
                if (widget.template.language !== TemplateLanguage.REACT) {
                // eslint-disable-next-line no-continue
                  continue;
                }
                // eslint-disable-next-line no-await-in-loop
                const precompiled = (await import('@/components/babelImport')).default(widget.template.html);
                // eslint-disable-next-line no-await-in-loop
                await precompileWidget({
                  variables: {
                    id: widget.id,
                    precompiled,
                  },
                });
              } catch (e) {
                console.error(e);
              }
            }
            enqueueSnackbar('Виджеты пререндерены', { variant: 'success' });
          }}
        >
          Пререндерить виджеты
        </Button>
      </div>
    </div>
  );
}
