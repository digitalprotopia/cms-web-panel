import FormEdit from '@/components/FormEdit';
import WidgetEdit from '@/components/WidgetEdit';
import { useSearchParams } from 'next/router';

function WidgetAdd(props) {
  const params = useSearchParams();
  const tableId = params.get('table-id');

  return (
    <div>
      <h2>Добавить форму</h2>
      <FormEdit tableId={tableId as string} />
    </div>
  );
}

export default WidgetAdd;
