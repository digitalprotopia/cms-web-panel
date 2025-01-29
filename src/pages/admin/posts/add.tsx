import PostEditForm from '@/components/forms/PostEditForm';
import { Typography } from '@mui/material';
import { useRouter } from 'next/router';

export default function PostAddPost() {
  const router = useRouter();

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Typography variant="h4">Добавить запись</Typography>
      <PostEditForm
        onClose={() => {
          router.push('/admin/posts');
        }}
      />
    </div>
  );
}
