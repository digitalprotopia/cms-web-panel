import PostEditForm from '@/components/forms/PostEditForm';
import { IconButton, Stack, Typography } from '@mui/material';
import AlarmIcon from '@mui/icons-material/Alarm';
import { useRouter } from 'next/router';

export default function PostEditPost() {
  const router = useRouter();
  const { id } = router.query;
  const handleHistoryClick = () => {
    router.push(`/admin/posts/${id}/history`);
  };
  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Редактировать запись</Typography>
        <IconButton 
          color="secondary" 
          aria-label="История изменений"
          onClick={handleHistoryClick}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(233, 30, 99, 0.1)'
            }
          }}
        >
          <AlarmIcon />
        </IconButton>
      </Stack>
      <PostEditForm
        id={id as string}
        onClose={() => {
          router.push('/admin/posts');
        }}
      />
    </div>
  );
}
