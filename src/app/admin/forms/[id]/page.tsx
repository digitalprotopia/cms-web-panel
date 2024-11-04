'use client';

import FormEdit from '@/components/FormEdit';
import WidgetEdit from '@/components/WidgetEdit';
import { useParams, useSearchParams } from 'next/navigation';

function FormEditPage(props) {
  const params = useParams();

  return (
    <div>
      <h2>Редактировать форму</h2>
      <FormEdit id={params.id as string} />
    </div>
  );
}

export default FormEditPage;
