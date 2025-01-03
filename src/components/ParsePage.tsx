/* eslint-disable react/no-danger */
import { gql, useQuery } from '@apollo/client';
import parse, { attributesToProps, DOMNode, domToReact } from 'html-react-parser';
import reactStringReplace from 'react-string-replace';
import {
  Button, IconButton, Typography,
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Map, Placemark, YMaps } from '@pbe/react-yandex-maps';
import { createPortal } from 'react-dom';
import { Close } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import Link from 'next/link';
import { ErrorBoundary } from 'react-error-boundary';
import UserContext from '@/components/UserContext';
import { useRouter } from 'next/router';
import useTable, { TableField, useAddRow } from './use-table';
import DynamicParse, { parseReact } from './DynamicParse';
import { FieldType } from './entities/IField';
import FormField from './form';
import { TemplateLanguage } from './entities/ITemplate';

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

export function ParseRow(
  props: {
    html: string,
    row: any,
    fields: TableField[],
    language:TemplateLanguage
  },
) {
  const {
    html, row, fields, language,
  } = props;

  const user = useContext(UserContext);

  const router = useRouter();

  if (language === TemplateLanguage.REACT) {
    const { Component } = parseReact(html, user, user.pages || [], router);
    return (
      <ErrorBoundary
        fallbackRender={({ error }) => (
          <div>
            Ошибка разбора:
            <pre>{error?.message}</pre>
          </div>
        )}
        resetKeys={[html]}
        onError={(err) => { console.log(err); }}
      >
        <Component row={row} />
      </ErrorBoundary>
    );
  }
  const resultRow = { ...row };
  fields.forEach((field) => {
    if (field.type === FieldType.DATE_TIME) {
      resultRow[field.dbName] = dayjs(row[field.dbName]).format('YYYY-MM-DD HH:mm');
    }
    if (field.type === FieldType.BOOLEAN) {
      resultRow[field.dbName] = row[field.dbName] ? 'Да' : 'Нет';
    }
    if (field.type === FieldType.TEXT) {
      resultRow[field.dbName] = <div style={{ whiteSpace: 'pre-wrap' }}>{row[field.dbName]}</div>;
    }
    if (field.type === FieldType.GEO) {
      // resultRow[field.dbName] = resultRow[field.dbName] ? (
      //   <WidgetMap row={row} field={field} />
      // ) : null;

      resultRow[field.dbName] = row[field.dbName] ? (`${row[field.dbName].lat}, ${row[field.dbName].lng}`) : null;
    }

    if (field.type === FieldType.ONE_TO_MANY_ONE) {
      resultRow[field.dbName] = row[field.dbName] ? row[field.dbName]._cms_title : null;
    }
    if (field.type === FieldType.ONE_TO_MANY_MANY
      || field.type === FieldType.MANY_TO_MANY_FIRST
      || field.type === FieldType.MANY_TO_MANY_SECOND) {
      resultRow[field.dbName] = row[field.dbName] ? row[field.dbName].map((r: any) => r._cms_title).join(', ') : null;
    }
  });
  return (
    <div key={resultRow.id}>
      <DynamicParse html={html} replace={resultRow} />
    </div>
  );
}

const WidgetList:React.FC<{ data: any, fields: TableField[], html: string,
  language?: TemplateLanguage
}> = function (props) {
  return props.data.map((row: any) => (
    <div key={row.id}>
      <ParseRow
        html={props.html}
        row={row}
        fields={props.fields}
        language={props.language || TemplateLanguage.SIMPLE}
      />
    </div>
  ));
};

const WidgetMap:React.FC<{ data: any, fields: TableField[], html: string,
  language?: TemplateLanguage
}> = function (props) {
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
          width="100%"
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
          // onLoad={(ymaps) => {
          //   console.log('load');
          // }}
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
          width: 200,
          minHeight: 200,
        }}
        >
          <div style={{ float: 'right' }}>
            <IconButton onClick={() => portal.balloon?.close()}>
              <Close />
            </IconButton>
          </div>
          <ParseRow
            html={props.html}
            row={props.data.find((row: any) => row.id === portal.rowId)}
            fields={props.fields}
            language={props.language || TemplateLanguage.SIMPLE}
          />
        </div>
      </Portal>
      )}
    </div>
  );
};

export function RenderWidget(
  props: {
    widgetViewType: string,
    html: string,
    fields: TableField[],
    data: any,
    language: TemplateLanguage,
  },
) {
  const {
    widgetViewType, html, fields, data, language,
  } = props;
  const user = useContext(UserContext);
  const router = useRouter();
  if (widgetViewType === 'map') {
    return (
      <WidgetMap
        data={data}
        fields={fields}
        html={html}
        language={language}
      />
    );
  }
  if (language === TemplateLanguage.REACT) {
    const template = parseReact(html, user, user.pages || [], router);
    if (template.ListComponent) {
      return (
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <div>
              Ошибка разбора:
              <pre>{error?.message}</pre>
            </div>
          )}
          resetKeys={[html]}
          onError={(err) => { console.log(err); }}
        >
          <template.ListComponent data={data} Component={template.Component} />
        </ErrorBoundary>
      );
    }
  }
  return (
    <WidgetList
      data={data}
      fields={fields}
      html={html}
      language={language}
    />
  );
}

export function PageWidget(props: {
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
                    language
                }
                tableView {
                    tableId
                }
            }
        }
    `, {
    variables: { name: props.widgetName },
  });

  const user = useContext(UserContext);
  const router = useRouter();

  let search: any;
  let filter: ReturnType<typeof parseReact>['filter'];
  if (data && data.getWidgetByName?.template.language === TemplateLanguage.REACT) {
    const widget = parseReact(
      data.getWidgetByName.template.html,
      user,
      user.pages || [],
      router,
    );
    filter = widget.filter;
    search = widget.search;
  }

  const table = useTable(data?.getWidgetByName?.tableView.tableId, { search });

  if (!data || !data?.getWidgetByName || (data?.getWidgetByName.tableView.tableId && !table.data)) {
    return null;
  }

  let resultData = table.data ? [...table.data] : [];

  try {
    if (filter) {
      resultData = table.data.filter(filter);
    }
  } catch {
    //
  }

  return (
    <RenderWidget
      widgetViewType={data.getWidgetByName.widgetViewType}
      html={data.getWidgetByName.template.html}
      fields={table.meta?.fields as TableField[]}
      data={resultData}
      language={data.getWidgetByName.template.language}
    />
  );
}

export function FormWidget(props: {
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
                        position
                        tableFieldId
                        formFieldType
                        createdAt
                        field {
                            id
                            type
                            name
                            dbName
                            oneToManyLinkOneTable {
                              id
                              dbName
                            }
                            oneToManyLinkManyTable {
                              id
                              dbName
                            }
                            manyToManyLinkFirstTable {
                              id
                              dbName
                            }
                            manyToManyLinkSecondTable {
                              id
                              dbName
                            }
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
      _data.getFormByName.fields.forEach((field: any) => {
        if (field.field.type === 'string') {
          _form[field.field.dbName] = '';
        }
        if (field.field.type === 'geo') {
          _form[field.field.dbName] = {
            lat: 0,
            lng: 0,
          };
        }
        if (field.field.type === 'boolean') {
          _form[field.field.dbName] = false;
        }
      });
      setForm(_form);
    },
  });
  const addRow = useAddRow(data?.getFormByName.table.dbName);
  const { enqueueSnackbar } = useSnackbar();
  if (!data?.getFormByName) {
    return null;
  }

  const fields = [...data.getFormByName.fields];
  fields.sort((a: any, b: any) => a.position - b.position);

  return (
    <div>
      <Typography variant="h4">{data.getFormByName.title}</Typography>
      <div>
        {data.getFormByName.fields.map((field: any) => {
          const fieldComponent = (
            <FormField
              title={field.title}
              field={field.field}
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
        <Button onClick={async () => {
          const _form:any = {};
          await addRow(form);
          fields.forEach((field: any) => {
            if (field.field.type === 'string') {
              _form[field.field.dbName] = '';
            }
            if (field.field.type === 'geo') {
              _form[field.field.dbName] = {
                lat: 0,
                lng: 0,
              };
            }
            if (field.field.type === 'boolean') {
              _form[field.field.dbName] = false;
            }
          });
          setForm(_form);
          enqueueSnackbar('Форма отправлена', { variant: 'success' });
        }}
        >
          Отправить

        </Button>
      </div>
    </div>
  );
}

function Posts() {
  const posts = useQuery(gql`
    query {
      getPosts {
        id
        title
        content
      }
    }
  `);

  if (!posts.data) {
    return null;
  }

  return (
    <div>
      {posts.data.getPosts.map((post: any) => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      ))}
    </div>
  );
}

function ParsePage(props: {
  html: string;
  args?: Record<string, string | React.JSX.Element | React.JSX.Element[]>
}) {
  return parse(
    props.html,
    {
      transform(reactNode, domNode) {
        if (domNode.type === 'tag' && domNode.name === 'a' && domNode.attribs.href) {
          const _props = attributesToProps(domNode.attribs);
          return (
            <Link {..._props as any}>
              {domToReact(domNode.children as DOMNode[])}
            </Link>
          );
        }
        if (domNode.type === 'text') {
          let result: string | React.ReactNode[] = domNode.data;
          if (props.args) {
            Object.keys(props.args).forEach((key) => {
              result = reactStringReplace(result, `{${key}}`, () => (props.args!)[key]);
            });
          }
          result = reactStringReplace(result, '[posts]', () => <Posts />);
          return reactStringReplace(result, /\[([a-zA-Z0-9]+:[a-zA-Z0-9]+)\]/g, (match, i) => {
            const parts = match.split(':');
            if (parts[0] === 'widget') {
              return (<PageWidget widgetName={parts[1]} key={i} />);
            }
            if (parts[0] === 'form') {
              return <FormWidget formName={parts[1]} key={i} />;
            }
            return match;
          }) as unknown as React.JSX.Element;
        }
        return reactNode as React.JSX.Element;
      },
    },
  );
}

export default ParsePage;
