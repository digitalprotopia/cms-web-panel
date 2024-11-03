import { gql, useQuery } from '@apollo/client';
import parse from 'html-react-parser';
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

function ParsePage(props: {
  html: string;
}) {
  return parse(
    props.html,
    {
      transform(reactNode, domNode, index) {
        if (domNode.type === 'text') {
          const matches = domNode.data.match(/^(.*)\{widget:([a-zA-Z0-9]+)\}(.*)$/);
          console.log(domNode.data);
          if (matches) {
            return (
              <>
                {matches[1]}
                <PageWidget widgetName={matches[2]} />
                {matches[3]}
              </>
            );
          }
        }
        return reactNode;
      },
    },
  );
}

export default ParsePage;
