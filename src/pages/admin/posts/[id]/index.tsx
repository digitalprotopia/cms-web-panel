import PostEditForm from '@/components/forms/PostEditForm';
import { Typography } from '@mui/material';
import { useRouter } from 'next/router';

export default function PostEditPost() {
  const router = useRouter();
  const { id } = router.query;
  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Typography variant="h4">Редактировать запись</Typography>
      <PostEditForm
        id={id as string}
        onClose={() => {
          router.push('/admin/posts');
        }}
      />
    </div>
  );
}
