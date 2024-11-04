'use client';

import WidgetEdit from '@/components/WidgetEdit';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

function WidgetEditPage(props) {
  const params = useParams();

  return (
    <div>
      <h2>Редактировать виджет</h2>
      <WidgetEdit id={params.id as string} />
    </div>
  );
}

export default WidgetEditPage;
