import PostEditForm from '@/components/forms/PostEditForm';
import { useRouter } from 'next/router';

export default function PostEditPost() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <PostEditForm
        id={id as string}
        onClose={() => router.push('/admin/posts')}
      />
    </div>
  );
}
