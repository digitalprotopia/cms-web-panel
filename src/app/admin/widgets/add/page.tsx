'use client';

import WidgetEdit from '@/components/WidgetEdit';
import { useSearchParams } from 'next/navigation';

function WidgetAdd(props) {
  const params = useSearchParams();
  const tableId = params.get('table-id');

  return (
    <div>
      <h2>Добавить виджет</h2>
      <WidgetEdit tableId={tableId as string} />
    </div>
  );
}

export default WidgetAdd;
