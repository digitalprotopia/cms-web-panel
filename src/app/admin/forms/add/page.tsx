'use client';

import FormEdit from '@/components/FormEdit';
import WidgetEdit from '@/components/WidgetEdit';
import { useSearchParams } from 'next/navigation';

function WidgetAdd(props) {
  const params = useSearchParams();
  const tableId = params.get('table-id');

  return (
    <div>
      <h2>Добавить виджет</h2>
      <FormEdit tableId={tableId as string} />
    </div>
  );
}

export default WidgetAdd;
