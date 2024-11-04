import { gql, useQuery } from '@apollo/client';
import parse from 'html-react-parser';
import reactStringReplace from 'react-string-replace';
import { Typography } from '@mui/material';
import useTable from './use-table';
import DynamicParse from './DynamicParse';

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

  return table.data.map((row) => (
    <div key={row.id}>
      <DynamicParse html={data.getWidgetByName.template.html} replace={row} />
    </div>
  ));
}

function FormWidget(props: {
  formName: string;
}) {
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
  });
  if (!data?.getFormByName) {
    return null;
  }
  return (
    <div>
      <Typography variant="h4">{data.getFormByName.title}</Typography>
      <div>
        {data.getFormByName.fields.map((field) => (
          <div key={field.id}>
            {field.title}
          </div>
        ))}
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
        return reactStringReplace(domNode.data, /\[([a-zA-Z0-9]+:[a-zA-Z0-9]+)\]/g, (match, i) => {
          console.log(match, i);
          const parts = match.split(':');
          if (parts[0] === 'widget') {
            return (<PageWidget widgetName={parts[1]} key={i} />);
          }
          if (parts[0] === 'form') {
            return <FormWidget formName={parts[1]} key={i} />;
          }
          return match;
        });
        return reactNode;
      },
    },
  );
}

export default ParsePage;
