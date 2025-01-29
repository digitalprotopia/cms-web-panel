import WidgetEdit from '@/components/WidgetEdit';
import { Typography } from '@mui/material';
import { useRouter } from 'next/router';

export default function WidgetEditPage() {
  const router = useRouter();
  const { id } = router.query;
  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Typography variant="h4">Редактировать виджет</Typography>
      <WidgetEdit
        id={id as string}
        onClose={() => {
          router.push('/admin/widgets');
        }}
      />
    </div>
  );
}
