import { Typography, Box, Paper, Divider, Chip } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { IPostHistory } from '@/components/entities/IPostHistory';

export default function PostHistoryPage() {
  const router = useRouter();
  const { id } = router.query;
  const [history, setHistory] = useState<IPostHistory[]>([]);

  useEffect(() => {
    if (id) {
      fetch(`/api/posts/${id}/history`)
        .then(res => res.json())
        .then(setHistory);
    }
  }, [id]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        История изменений записи #{id}
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        {history.map((record, index) => (
          <Box key={record.id} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1">
                Версия от {new Date(record.createdAt).toLocaleString()}
              </Typography>
              <Chip 
                label={`v${history.length - index}`} 
                color="secondary" 
                size="small"
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Заголовок:
                </Typography>
                <Typography>{record.title}</Typography>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Превью:
                </Typography>
                <Typography>{record.preview}</Typography>
              </Box>
            </Box>
            
            {index !== history.length - 1 && (
              <Divider sx={{ mt: 2 }} />
            )}
          </Box>
        ))}
      </Paper>
    </Box>
  );
}