import { useRouter } from 'next/router';
import { Typography } from '@mui/material';

import WidgetEdit from '@/components/WidgetEdit';

export default function WidgetAddPage() {
  const router = useRouter();
  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <Typography variant="h4">Добавить виджет</Typography>
      <WidgetEdit
        onClose={() => {
          router.push('/admin/widgets');
        }}
      />
    </div>
  );
}
