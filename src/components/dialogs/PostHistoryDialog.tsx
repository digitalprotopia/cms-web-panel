import * as React from 'react';
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
  ListItemButton,
} from '@mui/material';
import {
  Restore as RestoreIcon,
  Person as PersonIcon,
  Schedule as TimeIcon,
} from '@mui/icons-material';
import { EditorProps, EditorProvider, Editor } from 'react-simple-wysiwyg';

import { BlockView } from '@/components/BlockEditor';
import { IPostHistory } from '@/components/entities/IPostHistory';

dayjs.extend(localizedFormat);
dayjs.extend(advancedFormat);
dayjs.locale('ru');

// todo: Переместить к комнпонентам если будет переиспользоваться.
// Только для просмотра модификация react-simple-wysiwyg DefaultEditor.
function WysiwygView(
  props: EditorProps,
) {
  return (
    <EditorProvider>
      <Editor {...props} disabled>
        {props.children}
      </Editor>
    </EditorProvider>
  );
}

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
  onRestorePost: (post: {
    title: string;
    blockContent: string;
    preview: string;
  }) => void;
}

export default function PostHistoryDialog(
  { open, postId, onClose, onRestorePost }: PostHistoryDialogProps,
) {
  const [selectedPost, setSelectedPost] = useState<IPostHistory>();

  const { loading, error, data } = useQuery(GET_POST_HISTORY, {
    variables: { postId },
    skip: !postId,
  });

  const handleSelectedPost = () => {
    if (selectedPost) {
      onRestorePost({
        title: selectedPost.title,
        blockContent: selectedPost.blockContent,
        preview: selectedPost.preview,
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
                {data?.getPostHistory?.map((post: IPostHistory, index: number) => (
                  <div key={post.id}>
                    <ListItem>
                      <ListItemButton
                        selected={typeof selectedPost !== 'undefined' && selectedPost.id === post.id}
                        onClick={() => setSelectedPost(post)}
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
                                {formatDateTime(post.createdAt)}
                              </Box>
                              <Typography variant="caption">{post.title}</Typography>
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

          <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
            {selectedPost ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h5">{selectedPost.title}</Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Chip
                    label={formatDateTime(selectedPost.createdAt)}
                    icon={<TimeIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`Версия ${data.getPostHistory.length - data.getPostHistory.findIndex((v: IPostHistory) => v.id === selectedPost.id)}`}
                    variant="outlined"
                    size="small"
                  />
                </Box>

                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Превью</Typography>
                  <WysiwygView
                    value={selectedPost.preview}
                  />
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
                    {selectedPost.blockContent
                      ? (
                        <BlockView
                          key={selectedPost.id}
                          blockContent={selectedPost.blockContent}
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
          onClick={handleSelectedPost}
          disabled={!selectedPost}
          startIcon={<RestoreIcon />}
          color="primary"
        >
          Восстановить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
