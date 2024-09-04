import React, {
  useState,
} from 'react';
import { useRouter } from 'next/router';
import DynamicParse from '../../../../../components/DynamicParse.tsx';
import useTableData from '../../../../../components/useTableData.ts';

function AddTemplate() {
  const router = useRouter();
  const tableDbName = router.query['table-id'];
  const [html, setHtml] = useState('<b>{text}</b>');
  const [replace, setReplace] = useState('replace');
  const { data, meta } = useTableData(tableDbName);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>
        {meta.fields.map((field, index) => <div key={index}>{`{${field.dbName}}`}</div>)}
      </div>
      <div>
        <textarea
          value={replace}
          onChange={(e) => {
            setReplace(e.target.value);
          }}
        />
        <textarea value={html} onChange={(e) => setHtml(e.target.value)} />
      </div>
      <div>
        {data.map((row, index) => (
          <DynamicParse html={html} replace={row} key={index} />
        ))}
      </div>
    </div>
  );
}

export default AddTemplate;
