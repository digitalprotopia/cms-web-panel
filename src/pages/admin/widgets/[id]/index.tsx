import { useRouter } from 'next/router';

import WidgetAddEditPage from '@/components/WidgetAddEditPage';

export default function WidgetEditPage() {
  const router = useRouter();
  const { id } = router.query;
  return (
    <WidgetAddEditPage
      id={id as string}
      onClose={() => {
        router.push('/admin/widgets');
      }}
    />
  );
}
