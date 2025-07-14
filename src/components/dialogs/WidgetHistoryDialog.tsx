import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  Paper,
  Skeleton,
  Typography,
} from '@mui/material';

import { IWidgetHistory } from '@/components/entities/IWidgetHistory';

interface WidgetHistoryDialogProps {
  isOpen: boolean;
  widgetId: string;
  onClose: () => void;
}

const GET_WIDGET_HISTORY = gql`
  query GetWidgetHistory($widgetId: ID!) {
    getWidgetHistory(widgetId: $widgetId) {
      id
      widgetId
      name
      title
      widgetViewType
      tableId
      markup
      markupLanguage
      style
      cssClass
      createdAt
    }
  }
`;

/*
todo: Переиспользовать в других модулях. Например в PostHistoryDialog.tsx
  и возможно в add-bot.tsx */
function ErrorBox({ error }: { error: Error }) {
  return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error">{error.message}</Alert>
    </Box>
  );
}

function WidgetHistoryPanel({
  loading,
  widgetHistory,
  setWidgetVersion,
}: {
  loading: boolean,
  widgetHistory?: IWidgetHistory[],
  setWidgetVersion: (widgetVersion: IWidgetHistory) => void
}) {
  return (
    <Paper
      sx={{ width: 320, overflowY: 'auto', borderRight: '1px solid #ddd' }}
      elevation={2}
    >
      {loading ? (
        Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height={80} sx={{ mb: 1 }} />
        ))
      ) : (
        <List dense>
          {/* WIP: Add widget history here. */}
          {widgetHistory?.map((widgetVersion: IWidgetHistory, index: number) => (
            <ListItem
              key={widgetVersion.id}
            />
          ))}
        </List>
      )}
    </Paper>
  );
}

function WidgetDetails({ widgetVersion }: { widgetVersion: IWidgetHistory | undefined }) {
  return (
    <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
      {widgetVersion ? (
        <>
          { /* WIP: Add selected widget detaisl here. */ }
        </>
      ) : (
        <Typography>Выберите версию для просмотра подробностей</Typography>
      )}
    </Box>
  );
}

export default function WidgetHistoryDialog(
  { isOpen, widgetId, onClose }: WidgetHistoryDialogProps,
) {
  const [widgetVersion, setWidgetVersion] = useState<IWidgetHistory | undefined>(undefined);

  const { loading, error, data } = useQuery(GET_WIDGET_HISTORY, {
    variables: { widgetId },
    skip: !widgetId,
  });

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h6">История версий</Typography>
      </DialogTitle>

      <DialogContent dividers>
        {/* Показать ошибки если есть */}
        {error && <ErrorBox error={error} />}

        <Box sx={{ display: 'flex', height: '500px' }}>
          {/* Вывести боковую панель списка истории изменения виджета */}
          <WidgetHistoryPanel
            loading={loading}
            widgetHistory={data?.getWidgetHistory}
            setWidgetVersion={setWidgetVersion}
          />
          {/* Вывести детали выбранной версии виджета */}
          <WidgetDetails widgetVersion={widgetVersion} />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
