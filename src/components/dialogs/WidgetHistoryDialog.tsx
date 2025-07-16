import dayjs from 'dayjs';
import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  Person as PersonIcon,
  Restore as RestoreIcon,
  Schedule as TimeIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
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
import { IWidgetData } from '@/components/entities/IWidget';
import { IWidgetVersion } from '@/components/entities/IWidgetVersion';

interface WidgetHistoryDialogProps {
  isOpen: boolean;
  widgetId: string;
  tables: ITable[];
  tablesLoading: boolean;
  onClose: (...args: any[]) => void;
  setWidgetData: (widgetData: IWidgetData) => void;
  restoredVersionId: string | null;
  setRestoredVersionId: (restoredVersionId: string | null) => void;
  onRestoreVersion: () => void;
  isEdited: boolean;
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
  restoredVersionId,
  isEdited,
}: {
  loading: boolean;
  widgetHistory?: IWidgetVersion[];
  selectedWidgetVersion: IWidgetVersion | null;
  setSelectedWidgetVersion: (widgetVersion: IWidgetVersion) => void;
  restoredVersionId: string | null;
  isEdited: boolean;
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
                    selectedWidgetVersion !== null
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
                        {
                          (!isEdited
                          && (restoredVersionId === widgetVersion.id
                            || (restoredVersionId === null && index === 0)))
                          && <Chip label="Current" size="small" sx={{ ml: 1 }} color="primary" />
                        }
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
  widgetVersion: IWidgetVersion | null,
  tables: ITable[]
}) {
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!widgetVersion) {
    return <Typography>Выберите версию для просмотра подробностей</Typography>;
  }

  return (
    <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
      <WidgetSettings
        widgetData={widgetVersion}
        readOnly
        tables={tables}
      />
    </Box>
  );
}

export default function WidgetHistoryDialog(
  {
    isOpen,
    widgetId,
    tables,
    tablesLoading,
    onClose,
    setWidgetData,
    restoredVersionId,
    setRestoredVersionId,
    onRestoreVersion,
    isEdited,
  }: WidgetHistoryDialogProps,
) {
  const [
    selectedWidgetVersion, setSelectedWidgetVersion,
  ] = useState<IWidgetVersion | null>(null);

  const { loading: widgetHistoryLoading, error, data } = useQuery(GET_WIDGET_HISTORY, {
    variables: { widgetId },
    skip: !widgetId,
  });

  const onCloseAction = (...args: any[]) => {
    setSelectedWidgetVersion(null);
    onClose(args);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onCloseAction}
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
            restoredVersionId={restoredVersionId}
            isEdited={isEdited}
          />
          {/* Вывести детали выбранной версии виджета */}
          <WidgetVersionDetails
            loading={tablesLoading || widgetHistoryLoading}
            widgetVersion={selectedWidgetVersion}
            tables={tables}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseAction}>Отмена</Button>
        <Button
          onClick={() => {
            if (selectedWidgetVersion) {
              setWidgetData(selectedWidgetVersion);
              setRestoredVersionId(selectedWidgetVersion.id);
              onRestoreVersion();
              onCloseAction();
            }
          }}
          disabled={!selectedWidgetVersion}
          startIcon={<RestoreIcon />}
          color="primary"
        >
          Восстановить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
