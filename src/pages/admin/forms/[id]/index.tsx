import FormEdit from '@/components/FormEdit';
import { Typography } from '@mui/material';
import { useRouter } from 'next/router';

export default function FormEditPage() {
  const router = useRouter();
  const { id } = router.query;
  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Typography variant="h4">Редактировать форму</Typography>
      <FormEdit
        id={id as string}
        onClose={() => {
          router.push('/admin/forms');
        }}
      />
    </div>
  );
}
