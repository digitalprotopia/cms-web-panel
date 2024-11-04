import {
  gql, useLazyQuery, useMutation, useQuery,
} from '@apollo/client';
import { useState } from 'react';
import { Button, TextField } from '@mui/material';
import useTable from './use-table';
import DynamicParse from './DynamicParse';

function WidgetEdit(props: {
  id?: string;
  tableId?: string;
}) {
  const [form, setForm] = useState({
    name: '',
    title: '',
    tableId: props.id ? '' : props.tableId,
    templateHtml: '',
  });
  const { data, loading } = useQuery(gql`
    query($id: ID!) {
      getWidget(id: $id) {
        id
        name
        title
        createdAt
        tableView {
          table {
            id
            name
            dbName
            createdAt
          }
        }
        template {
          id
          html
        }
      }
    }
  `, {
    variables: { id: props.id },
    onCompleted: (_data) => {
      setForm({
        name: _data.getWidget.name,
        title: _data.getWidget.title,
        tableId: _data.getWidget.tableView.table.id,
        templateHtml: _data.getWidget.template.html,
      });
    },
    skip: !props.id,
  });
  const [createWidget] = useMutation(gql`
    mutation($input: WidgetInput! $tableView: TableViewInput! $template: TemplateInput!) {
      createWidget(input: $input tableViewInput: $tableView templateInput: $template) {
        id
      }
    }
  `);

  const [editWidget] = useMutation(gql`
    mutation($id: ID! $input: WidgetInput! $tableView: TableViewInput! $template: TemplateInput!) {
      editWidget(id: $id input: $input tableViewInput: $tableView templateInput: $template) {
        id
      }
    }
  `);

  const table = useTable(form.tableId || '');
  if (!table.data) {
    return 'Loading';
  }
  return (
    <div>
      <div>
        <TextField
          label="Название"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>
      <div>
        <TextField
          label="Код"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div>
        <TextField
          label="HTML"
          value={form.templateHtml}
          onChange={(e) => setForm({ ...form, templateHtml: e.target.value })}
          multiline
        />
      </div>
      <div>
        <DynamicParse html={form.templateHtml} replace={table.data[0] || {}} />
      </div>
      {table.meta?.fields.map((field) => (
        <div
          key={field.id}
          onClick={(e) => {
            setForm({ ...form, templateHtml: `${form.templateHtml}{${field.dbName}}` });
          }}
        >
          {`{${field.dbName}}`}
        </div>
      ))}
      <div>
        <Button onClick={() => {
          const variables = {
            input: {
              name: form.name,
              title: form.title,
            },
            tableView: {
              title: form.title,
              name: form.name,
              tableId: form.tableId,
            },
            template: {
              title: form.title,
              html: form.templateHtml,
            },
          };
          if (props.id) {
            editWidget({
              variables: {
                id: props.id,
                ...variables,
              },
            });
          } else {
            createWidget({ variables });
          }
        }}
        >
          {props.id ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </div>
  );
}

export default WidgetEdit;
