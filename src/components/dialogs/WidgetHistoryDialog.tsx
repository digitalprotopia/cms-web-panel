import dayjs from 'dayjs';
import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  Person as PersonIcon,
  Schedule as TimeIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Skeleton,
  Typography,
} from '@mui/material';

import WidgetSettings from '@/components/WidgetSettings';
import { ITable } from '@/components/entities/ITable';
import { IWidgetVersion } from '@/components/entities/IWidgetVersion';

interface WidgetHistoryDialogProps {
  isOpen: boolean;
  widgetId: string;
  onClose: (...args: any[]) => void;
  tables: ITable[];
  tablesLoading: boolean;
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
todo: Выбрать шаблоны дат и сделать общий хелпер для проекта. Смотри поиск
  по регексу `dayjs\(.*\)\.format` в проетке. */
const formatDateTime = (
  dateString: dayjs.ConfigType,
): string => dayjs(dateString).format('D MMMM YYYY года HH:mm');

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
  selectedWidgetVersion,
  setSelectedWidgetVersion,
}: {
  loading: boolean,
  widgetHistory?: IWidgetVersion[],
  selectedWidgetVersion?: IWidgetVersion,
  setSelectedWidgetVersion: (widgetVersion: IWidgetVersion) => void
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
          {widgetHistory?.map((widgetVersion: IWidgetVersion, index: number) => (
            <div key={widgetVersion.id}>
              <ListItem>
                <ListItemButton
                  selected={
                    typeof selectedWidgetVersion !== 'undefined'
                    && widgetVersion.id === selectedWidgetVersion.id
                  }
                  onClick={() => setSelectedWidgetVersion(widgetVersion)}
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'grey.300' }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={(
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {`Версия ${widgetHistory.length - index}`}
                        </Typography>
                        {index === 0 && (
                          <Chip label="Current" size="small" sx={{ ml: 1 }} color="primary" />
                        )}
                      </Box>
                    )}
                    secondary={(
                      <>
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                          <TimeIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                          {formatDateTime(widgetVersion.createdAt)}
                        </Box>
                        <Typography variant="caption">{widgetVersion.title}</Typography>
                      </>
                    )}
                  />
                </ListItemButton>
              </ListItem>
              <Divider variant="inset" component="li" />
            </div>
          ))}
        </List>
      )}
    </Paper>
  );
}

function WidgetVersionDetails({
  loading,
  widgetVersion,
  tables,
}: {
  loading: boolean,
  widgetVersion: IWidgetVersion | undefined,
  tables: ITable[]
}) {
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!widgetVersion) {
    return <Typography>Выберите версию для просмотра подробностей</Typography>;
  }

  const {
    id: widgetHistoryId,
    markupLanguage: language,
    createdAt,
    ...widgetFields
  } = widgetVersion;
  const widget = { language, ...widgetFields };

  return (
    // WIP: Adjust styles.
    <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
      <WidgetSettings
        widget={widget}
        setWidget={() => {}}
        readOnly
        tables={tables}
      />
    </Box>
  );
}

export default function WidgetHistoryDialog(
  { isOpen, widgetId, onClose, tables, tablesLoading }: WidgetHistoryDialogProps,
) {
  const [
    selectedWidgetVersion, setSelectedWidgetVersion,
  ] = useState<IWidgetVersion | undefined>(undefined);

  const { loading: widgetHistoryLoading, error, data } = useQuery(GET_WIDGET_HISTORY, {
    variables: { widgetId },
    skip: !widgetId,
  });

  return (
    <Dialog
      open={isOpen}
      onClose={(args) => {
        setSelectedWidgetVersion(undefined);
        onClose(args);
      }}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6">История версий</Typography>
      </DialogTitle>

      <DialogContent dividers>
        {/* Показать ошибки если есть */}
        {error && <ErrorBox error={error} />}

        <Box sx={{ display: 'flex', height: '500px' }}>
          {/* Вывести боковую панель списка истории изменения виджета */}
          <WidgetHistoryPanel
            loading={widgetHistoryLoading}
            widgetHistory={data?.getWidgetHistory}
            selectedWidgetVersion={selectedWidgetVersion}
            setSelectedWidgetVersion={setSelectedWidgetVersion}
          />
          {/* Вывести детали выбранной версии виджета */}
          <WidgetVersionDetails
            loading={tablesLoading || widgetHistoryLoading}
            widgetVersion={selectedWidgetVersion}
            tables={tables}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
