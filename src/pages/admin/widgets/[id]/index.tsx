import { useRouter } from 'next/router';

import WidgetAddEdit from '@/components/WidgetAddEdit';

export default function WidgetEditPage() {
  const router = useRouter();
  const { id } = router.query;
  return (
    <WidgetAddEdit
      id={id as string}
      onClose={() => {
        router.push('/admin/widgets');
      }}
    />
  );
}
