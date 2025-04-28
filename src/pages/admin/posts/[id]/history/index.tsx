import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import {
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
  IconButton,
  Tooltip,
  Skeleton,
  Alert
} from '@mui/material';
import {
  Restore as RestoreIcon,
  Person as PersonIcon,
  Schedule as TimeIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';

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

const RESTORE_HISTORY = gql`
  mutation RestorePostHistory($historyId: ID!) {
    restorePostHistory(historyId: $historyId) {
      id
      title
    }
  }
`;

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatBlockContent = (content) => {
  try {
    if (typeof content !== 'string') {
      content = JSON.stringify(content);
    }
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return content;
  }
};

export default function PostHistoryView() {
  const router = useRouter();
  const { id } = router.query;
  const [selectedVersion, setSelectedVersion] = useState(null);

  const { loading, error, data } = useQuery(GET_POST_HISTORY, {
    variables: { postId: id },
    skip: !id
  });

  const [restoreHistory] = useMutation(RESTORE_HISTORY, {
    onCompleted: () => router.push(`/admin/posts/${id}/edit`),
    onError: (err) => alert(`Restore error: ${err.message}`)
  });

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error.message}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Sidebar with versions */}
      <Paper sx={{ width: 320, p: 2, overflowY: 'auto', borderRight: '1px solid #ddd' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => router.back()} sx={{ mr: 1 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6">Version History</Typography>
        </Box>

        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width="100%" height={80} sx={{ mb: 1 }} />
          ))
        ) : (
          <List dense>
            {data?.getPostHistory?.map((version, index) => (
              <div key={version.id}>
                <ListItem 
                  button
                  selected={selectedVersion?.id === version.id}
                  onClick={() => setSelectedVersion(version)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'grey.300' }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Version {data.getPostHistory.length - index}
                        </Typography>
                        {index === 0 && (
                          <Chip label="Current" size="small" sx={{ ml: 1 }} color="primary" />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                          <TimeIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                          {formatDateTime(version.createdAt)}
                        </Box>
                        <Typography variant="caption">{version.title}</Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </div>
            ))}
          </List>
        )}
      </Paper>

      {/* Main content */}
      <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
        {selectedVersion ? (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5">{selectedVersion.title}</Typography>
              <Tooltip title="Restore this version">
              <IconButton onClick={() => restoreHistory({ variables: { historyId: selectedVersion.id } })}>
                <RestoreIcon color="primary" />
              </IconButton>
              </Tooltip>
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
                label={`Version ${data.getPostHistory.length - data.getPostHistory.findIndex(v => v.id === selectedVersion.id)}`}
                variant="outlined"
                size="small"
              />
            </Box>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Preview</Typography>
              <Typography>{selectedVersion.preview}</Typography>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Content</Typography>
              <Box 
                component="pre" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1,
                  maxHeight: '50vh',
                  overflow: 'auto'
                }}
              >
                {formatBlockContent(selectedVersion.blockContent)}
              </Box>
            </Paper>
          </>
        ) : (
          <Typography>Select a version to view details</Typography>
        )}
      </Box>
    </Box>
  );
}