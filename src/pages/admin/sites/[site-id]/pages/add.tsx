import PageEditForm from '@/components/forms/PageEditForm';
import { Typography } from '@mui/material';
import { useRouter } from 'next/router';

export default function PageAddPage() {
  const router = useRouter();

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Typography variant="h4">Добавить страницу</Typography>
      <PageEditForm
        onClose={() => {
          router.push(`/admin/sites/${router.query['site-id']}/pages`);
        }}
      />
    </div>
  );
}
