import { useState } from 'react';
import PostEditForm from '@/components/forms/PostEditForm';
import { IconButton, Stack, Typography } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { useRouter } from 'next/router';
import PostHistoryDialog from '@/components/dialogs/PostHistoryDialog';
import { IPost } from '@/components/entities/IPost';

export default function PostEditPost() {
  const router = useRouter();
  const { id } = router.query;
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyData, setHistoryData] = useState<Partial<IPost> | null>(null);

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Редактировать запись</Typography>
        {id && (
          <IconButton 
            color="secondary" 
            aria-label="История изменений"
            onClick={() => setHistoryDialogOpen(true)}
            sx={{
              color: 'black',
              '&:hover': {
                backgroundColor: 'rgba(233, 30, 99, 0.1)'
              }
            }}
          >
            <HistoryIcon />
          </IconButton>
        )}
      </Stack>
      
      <PostEditForm
        id={id as string}
        historyData={historyData}
        onClose={() => router.push('/admin/posts')}
      />

      {id && (
        <PostHistoryDialog
          open={historyDialogOpen}
          postId={id as string}
          onClose={() => setHistoryDialogOpen(false)}
          onSelectVersion={(version: { title: any; blockContent: any; preview: any; }) => setHistoryData({
            title: version.title,
            blockContent: version.blockContent,
            preview: version.preview
          })}
        />
      )}
    </div>
  );
}