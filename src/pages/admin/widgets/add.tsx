import { useRouter } from 'next/router';

import WidgetAddEdit from '@/components/WidgetAddEdit';

export default function WidgetAddPage() {
  const router = useRouter();
  return (
    <WidgetAddEdit
      onClose={() => {
        router.push('/admin/widgets');
      }}
    />
  );
}
