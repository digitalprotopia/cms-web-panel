import { useRouter } from 'next/router';

import WidgetAddEditPage from '@/components/WidgetAddEditPage';

export default function WidgetAddPage() {
  const router = useRouter();
  return (
    <WidgetAddEditPage
      onClose={() => {
        router.push('/admin/widgets');
      }}
    />
  );
}
