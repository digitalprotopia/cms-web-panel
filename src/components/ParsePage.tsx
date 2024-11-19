import { gql, useQuery } from '@apollo/client';
import parse from 'html-react-parser';
import reactStringReplace from 'react-string-replace';
import {
  Button, Checkbox, TextField, Typography,
} from '@mui/material';
import { useState } from 'react';
import dayjs from 'dayjs';
import useTable, { useAddRow } from './use-table';
import DynamicParse from './DynamicParse';
import { FieldType } from './entities/IField';
import { FormField } from './form';

function PageWidget(props: {
  widgetName: string;
}) {
  const { data } = useQuery(gql`
        query($name: String!) {
            getWidgetByName(name: $name) {
                id
                name
                template {
                    html
                }
                tableView {
                    tableId
                }
            }
        }
    `, {
    variables: { name: props.widgetName },
  });

  const table = useTable(data?.getWidgetByName.tableView.tableId);

  if (!table.data) {
    return null;
  }

  return table.data.map((row) => {
    row = { ...row };
    table.meta?.fields.forEach((field) => {
      if (field.type === FieldType.DATE) {
        row[field.dbName] = dayjs(row[field.dbName]).format('YYYY-MM-DD HH:mm');
      }
      if (field.type === FieldType.BOOLEAN) {
        row[field.dbName] = row[field.dbName] ? 'Да' : 'Нет';
      }
      if (field.type === FieldType.TEXT) {
        row[field.dbName] = <div style={{ whiteSpace: 'pre' }}>{row[field.dbName]}</div>;
      }
    });
    return (
      <div key={row.id}>
        <DynamicParse html={data.getWidgetByName.template.html} replace={row} />
      </div>
    );
  });
}

function FormWidget(props: {
  formName: string;
}) {
  const [form, setForm] = useState<any>({});
  const { data } = useQuery(gql`
            query($name: String!) {
                getFormByName(name: $name) {
                    id
                    name
                    title
                    createdAt
                    fields {
                        id
                        title
                        name
                        tableFieldId
                        formFieldType
                        createdAt
                        field {
                            id
                            type
                            name
                            dbName
                        }
                    }
                    table {
                        id
                        name
                        dbName
                    }
                }
            }
        `, {
    variables: { name: props.formName },
    onCompleted: (_data) => {
      const _form: any = {};
      _data.getFormByName.fields.forEach((field) => {
        if (field.field.type === 'string') {
          _form[field.field.dbName] = '';
        }
        if (field.field.type === 'boolean') {
          _form[field.field.dbName] = false;
        }
      });
      setForm(_form);
    },
  });
  const addRow = useAddRow(data?.getFormByName.table.dbName);
  if (!data?.getFormByName) {
    return null;
  }
  return (
    <div>
      <Typography variant="h4">{data.getFormByName.title}</Typography>
      <div>
        {data.getFormByName.fields.map((field) => {
          const fieldComponent = (
            <FormField
              title={field.title}
              type={field.field.type}
              value={form[field.field.dbName]}
              onChange={(value) => setForm({ ...form, [field.field.dbName]: value })}
            />
          );

          return (
            <div key={field.id}>
              {fieldComponent}
            </div>
          );
        })}
      </div>
      <div>
        <Button onClick={() => addRow(form)}>Добавить</Button>
      </div>
    </div>
  );
}

function ParsePage(props: {
  html: string;
}) {
  return parse(
    props.html,
    {
      transform(reactNode, domNode, index) {
        if (domNode.type === 'text') {
          return reactStringReplace(domNode.data, /\[([a-zA-Z0-9]+:[a-zA-Z0-9]+)\]/g, (match, i) => {
            const parts = match.split(':');
            if (parts[0] === 'widget') {
              return (<PageWidget widgetName={parts[1]} key={i} />);
            }
            if (parts[0] === 'form') {
              return <FormWidget formName={parts[1]} key={i} />;
            }
            return match;
          });
        }
        return reactNode;
      },
    },
  );
}

export default ParsePage;
