import PageEditForm from '@/components/forms/PageEditForm';
import { Typography } from '@mui/material';
import { useRouter } from 'next/router';

export default function PageEditPage() {
  const router = useRouter();
  const { id } = router.query;
  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Typography variant="h4">Редактировать страницу</Typography>
      <PageEditForm
        id={id as string}
        onClose={() => {
          router.push(`/admin/sites/${router.query['site-id']}/pages`);
        }}
      />
    </div>
  );
}
