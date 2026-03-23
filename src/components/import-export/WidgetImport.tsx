import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';

import { IWidgetGraphQL, IWidgetExportData } from '@/components/entities/IWidget';
import { GET_ALL_WIDGETS } from './WidgetExport';

const CREATE_WIDGET = gql`
  mutation CreateWidget(
    $input: WidgetInput!
    $tableView: TableViewInput!
    $template: TemplateInput!
  ) {
    createWidget(
      input: $input
      tableViewInput: $tableView
      templateInput: $template
    ) {
      id
    }
  }
`;

const UPDATE_WIDGET = gql`
  mutation EditWidget(
    $id: ID!
    $input: WidgetInput!
    $tableView: TableViewInput!
    $template: TemplateInput!
  ) {
    editWidget(
      id: $id
      input: $input
      tableViewInput: $tableView
      templateInput: $template
    ) {
      id
    }
  }
`;

interface WidgetImportProps {
  data: IWidgetExportData[];
  onImportSuccess: () => void;
}

export default function WidgetImport({ data: importData, onImportSuccess }: WidgetImportProps) {
  const [importStatus, setImportStatus] = useState<{ type: 'error' | 'info' | 'success', message: string } | null>(null);

  const { data: existingData, loading } = useQuery(GET_ALL_WIDGETS);

  const [createWidget] = useMutation(CREATE_WIDGET);
  const [updateWidget] = useMutation(UPDATE_WIDGET);

  const handleImport = async () => {
    if (!importData) return;
    setImportStatus({ type: 'info', message: 'Импорт начался...' });

    const existingWidgets = existingData?.getAllWidgets || [];

    try {
      await Promise.all(importData.map(async (widgetData) => {
        const existing = existingWidgets.find((w: IWidgetGraphQL) => w.name === widgetData.name);

        const variables = {
          input: {
            name: widgetData.name,
            title: widgetData.title,
            widgetViewType: widgetData.widgetViewType,
            cssClass: widgetData.cssClass || '',
            precompiled: widgetData.precompiled || '',
          },
          tableView: {
            title: widgetData.title,
            name: widgetData.name,
            tableId: widgetData.tableId || null,
          },
          template: {
            title: widgetData.title,
            html: widgetData.markup || '',
            language: widgetData.markupLanguage || 'simple',
            css: widgetData.style || '',
          },
        };

        if (existing) {
          await updateWidget({ variables: { id: existing.id, ...variables } });
        } else {
          await createWidget({ variables: { ...variables } });
        }
      }));

      setImportStatus({ type: 'success', message: 'Импорт виджетов успешно завершен!' });
      setTimeout(() => {
        onImportSuccess();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setImportStatus({ type: 'error', message: `Ошибка при импорте: ${err.message}` });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  const existingWidgets = existingData?.getAllWidgets || [];
  const widgetsToOverwrite = importData.filter(
    (imp) => existingWidgets.some((ex: IWidgetGraphQL) => ex.name === imp.name),
  );

  return (
    <Box>
      <Typography variant="subtitle1" mb={1}>
        Найдено виджетов в файле:
        {' '}
        <strong>{importData.length}</strong>
      </Typography>

      {widgetsToOverwrite.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Следующие виджеты уже существуют и будут перезаписаны:
          {' '}
          <strong>{widgetsToOverwrite.map((w) => w.name).join(', ')}</strong>
        </Alert>
      )}

      {importStatus && (
        <Alert severity={importStatus.type} sx={{ mb: 2 }}>
          {importStatus.message}
        </Alert>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleImport}
        disabled={importStatus?.type === 'info'}
      >
        Подтвердить импорт виджетов
      </Button>
    </Box>
  );
}
