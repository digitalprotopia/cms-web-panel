import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  Skeleton,
  Alert,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Restore as RestoreIcon,
  Person as PersonIcon,
  Schedule as TimeIcon,
} from '@mui/icons-material';

import BlockEditor from '../BlockEditor';
import { IPostHistory } from '../entities/IPostHistory';

dayjs.extend(localizedFormat);
dayjs.extend(advancedFormat);
dayjs.locale('ru');

const GET_POST_HISTORY = gql`
  query GetPostHistory($postId: ID!) {
    getPostHistory(postId: $postId) {
      id
      postId
      title
      blockContent
      preview
      createdAt
    }
  }
`;

const formatDateTime = (
  dateString: dayjs.ConfigType,
): string => dayjs(dateString).format('D MMMM YYYY года HH:mm');

interface PostHistoryDialogProps {
  open: boolean;
  postId: string;
  onClose: () => void;
  onRestoreVersion: (version: {
    title: string;
    blockContent: string;
    preview: string;
  }) => void;
}

export default function PostHistoryDialog(
  { open, postId, onClose, onRestoreVersion }: PostHistoryDialogProps,
) {
  const [selectedVersion, setSelectedVersion] = useState<IPostHistory>();

  const { loading, error, data } = useQuery(GET_POST_HISTORY, {
    variables: { postId },
    skip: !postId,
  });

  const handleSelectVersion = () => {
    if (selectedVersion) {
      onRestoreVersion({
        title: selectedVersion.title,
        blockContent: selectedVersion.blockContent,
        preview: selectedVersion.preview,
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Typography variant="h6">История версий</Typography>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">{error.message}</Alert>
          </Box>
        )}

        <Box sx={{ display: 'flex', height: '500px' }}>
          <Paper sx={{ width: 320, overflowY: 'auto', borderRight: '1px solid #ddd' }}>
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} variant="rectangular" width="100%" height={80} sx={{ mb: 1 }} />
              ))
            ) : (
              <List dense>
                {data?.getPostHistory?.map((version: IPostHistory, index: number) => (
                  <div key={version.id}>
                    <ListItem
                      onClick={() => setSelectedVersion(version)}
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
                              {`Версия ${data.getPostHistory.length - index}`}
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
                              {formatDateTime(version.createdAt)}
                            </Box>
                            <Typography variant="caption">{version.title}</Typography>
                          </>
                        )}
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </div>
                ))}
              </List>
            )}
          </Paper>

          <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
            {selectedVersion ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h5">{selectedVersion.title}</Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Chip
                    label={formatDateTime(selectedVersion.createdAt)}
                    icon={<TimeIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`Версия ${data.getPostHistory.length - data.getPostHistory.findIndex((v: IPostHistory) => v.id === selectedVersion.id)}`}
                    variant="outlined"
                    size="small"
                  />
                </Box>

                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Превью</Typography>
                  <Typography>{selectedVersion.preview}</Typography>
                </Paper>

                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Контент</Typography>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 1,
                      maxHeight: '50vh',
                      overflow: 'auto',
                    }}
                  >
                    {selectedVersion.blockContent
                      ? (
                        <BlockEditor
                          initialData={selectedVersion.blockContent}
                          readOnly
                        />
                      )
                      : (<Typography>Нет содержимого</Typography>)}
                  </Box>
                </Paper>
              </>
            ) : (
              <Typography>Выберите версию для просмотра подробностей</Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          onClick={handleSelectVersion}
          disabled={!selectedVersion}
          startIcon={<RestoreIcon />}
          color="primary"
        >
          Выбрать версию
        </Button>
      </DialogActions>
    </Dialog>
  );
}
