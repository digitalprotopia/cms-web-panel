import { gql, useQuery } from '@apollo/client';
import parse from 'html-react-parser';
import reactStringReplace from 'react-string-replace';
import {
  Button, Checkbox, IconButton, TextField, Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Map, Placemark, YMaps } from '@pbe/react-yandex-maps';
import { createPortal, render } from 'react-dom';
import { Close } from '@mui/icons-material';
import useTable, { TableField, useAddRow } from './use-table';
import DynamicParse from './DynamicParse';
import { FieldType } from './entities/IField';
import { FormField } from './form';

const WidgetMap:React.FC<{ data: any, fields: TableField[], html: string }> = function (props) {
  const [portal, setPortal] = useState<{
    open: boolean,
    portalId: string,
    rowId: string,
    balloon?: ymaps.geoObject.Balloon,
  }>({
    open: false,
    portalId: '',
    rowId: '',
  });

  return (
    <div style={{ minHeight: 400 }}>
      <style>
        {`
          .ymaps-2-1-79-balloon__layout {
            width: 0px;
          }
        `}
      </style>
      <YMaps query={{
        apikey: window.config.yandexKey,
      }}
      >
        <Map
          defaultState={{
            center: [55.751574, 37.573856],
            zoom: 5,
          }}
          height={400}
          modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
          instanceRef={(ref) => {
            if (ref) {
              console.log(ref);
              ref.geoObjects.events.add('balloonopen', (e) => {
                setPortal({
                  open: true,
                  portalId: e.get('target').properties.get('elementId'),
                  rowId: e.get('target').properties.get('rowId'),
                  balloon: e.get('target').balloon,
                });
              });
              ref.geoObjects.events.add('balloonclose', () => {
                setPortal({ ...portal, open: false });
              });
            }
          }}
          onLoad={(ymaps) => {
            console.log('load');
          }}
        >
          {props.data.map((row: any) => {
            const field = props.fields.find((f) => f.type === FieldType.GEO);
            if (!field || !row[field.dbName]) {
              return null;
            }
            return (
              <Placemark
                geometry={[row[field.dbName].lat, row[field.dbName].lng]}
                properties={{
                  balloonContent: `<div id="${row.id}${field.dbName}" style="position: fixed;"></div>`,
                  elementId: `${row.id}${field.dbName}`,
                  rowId: row.id,
                }}
              />
            );
          })}
        </Map>
      </YMaps>
      {portal.open && (
      <Portal elementId={portal.portalId}>
        <div style={{
          position: 'relative',
          left: -20,
          top: -20,
          backgroundColor: 'white',
          minWidth: 200,
          minHeight: 200,
        }}
        >
          <div style={{ float: 'right' }}>
            <IconButton onClick={() => portal.balloon?.close()}>
              <Close />
            </IconButton>
          </div>
          {parseRow(
            props.html,
            props.data.find((row: any) => row.id === portal.rowId),
            props.fields,
          )}
        </div>
      </Portal>
      )}
    </div>
  );
};

const Portal:React.FC<{ elementId: string, children: React.ReactNode }> = function (props) {
  // находим искомый HTML по id
  const mount = document.getElementById(props.elementId);
  // создаём свой div
  const el = document.createElement('div');

  useEffect(() => {
    // добавляем свой див к искомому элементу
    if (mount) mount.appendChild(el);
    return () => {
      // удаляем элемент от искомого при завершении компоненты
      if (mount) mount.removeChild(el);
    };
  }, [el, mount]);

  // отменяем отрисовку при отсутствии искомого элемента
  if (!mount) return null;
  // собственно, пририсовываем React-элемент в div к искомому HTML
  return createPortal(props.children, el);
};

export function parseRow(html: string, row: any, fields: TableField[]) {
  const resultRow = { ...row };
  fields.forEach((field) => {
    if (field.type === FieldType.DATE) {
      resultRow[field.dbName] = dayjs(row[field.dbName]).format('YYYY-MM-DD HH:mm');
    }
    if (field.type === FieldType.BOOLEAN) {
      resultRow[field.dbName] = row[field.dbName] ? 'Да' : 'Нет';
    }
    if (field.type === FieldType.TEXT) {
      resultRow[field.dbName] = <div style={{ whiteSpace: 'pre' }}>{row[field.dbName]}</div>;
    }
    if (field.type === FieldType.GEO) {
      // resultRow[field.dbName] = resultRow[field.dbName] ? (
      //   <WidgetMap row={row} field={field} />
      // ) : null;

      resultRow[field.dbName] = row[field.dbName] ? (`${row[field.dbName].lat}, ${row[field.dbName].lng}`) : null;
    }
  });
  return (
    <div key={resultRow.id}>
      <DynamicParse html={html} replace={resultRow} />
    </div>
  );
}

export function renderWidget(
  widgetViewType: string,
  html: string,
  fields: TableField[],
  data: any,
) {
  if (widgetViewType === 'map') {
    return (
      <WidgetMap
        data={data}
        fields={fields}
        html={html}
      />
    );
  }
  return data.map((row) => (
    <div key={row.id}>
      {parseRow(html, row, fields)}
    </div>
  ));
}

function PageWidget(props: {
  widgetName: string;
}) {
  const { data } = useQuery(gql`
        query($name: String!) {
            getWidgetByName(name: $name) {
                id
                name
                widgetViewType
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

  if (!data || !table.data) {
    return null;
  }

  return renderWidget(
    data.getWidgetByName.widgetViewType,
    data.getWidgetByName.template.html,
    table.meta?.fields as TableField[],
    table.data,
  );
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
