import React, {
  useState,
} from 'react';
import { useRouter } from 'next/router';
import { TextField } from '@mui/material';
import DynamicParse from '../../../../../components/DynamicParse.tsx';
import useTableData from '../../../../../components/useTableData.ts';

function AddTemplate() {
  const router = useRouter();
  const tableDbName = router.query['table-id'] as string;
  const [html, setHtml] = useState('<b>{text}</b>');
  const [title, setTitle] = useState('');
  const { data, meta } = useTableData(tableDbName, (meta) => {
    setHtml(meta.fields.map((field) => `{${field.dbName}}`).join(' '));
  });

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>
        {meta.fields.map((field, index) => <div key={index}>{`{${field.dbName}}`}</div>)}
      </div>
      <div>
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
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
