import FormEdit from '@/components/FormEdit';
import { Typography } from '@mui/material';
import { useRouter } from 'next/router';

export default function FormAddPage() {
  const router = useRouter();
  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Typography variant="h4">Добавить форму</Typography>
      <FormEdit
        onClose={() => {
          router.push('/admin/forms');
        }}
      />
    </div>
  );
}
