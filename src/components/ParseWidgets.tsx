import { gql, useQuery } from '@apollo/client';
import React, { useContext, useEffect, useState } from 'react';
import { useRouter, NextRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { Button, IconButton, Typography } from '@mui/material';
import { createPortal } from 'react-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { Map, Placemark, YMaps } from '@pbe/react-yandex-maps';
import { Close } from '@mui/icons-material';
import dayjs from 'dayjs';

import * as Mui from '@mui/material';

import * as babel from '@babel/standalone';

import Head from 'next/head';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import ruLocale from '@fullcalendar/core/locales/ru';
import Link from 'next/link';
import { Register } from '@/pages/auth/register';
import { Login } from '@/pages/auth/login';
import { FieldType } from './entities/IField';
import FormField from './form';
import useTable, {
  TableField, useAddRow, useCategories, usePosts,
  usePostsByCategorySlug, usePostsByTagSlug, useTableByDbName, useTags,
} from './use-table';
import { TemplateLanguage } from './entities/ITemplate';
import DynamicParse from './DynamicParse';
import UserContext, { UserContextData } from './UserContext';

import { ISiteItem } from './entities/ISiteItem';
import { getReactTemplateDefinition } from './reactTemplates';
// eslint-disable-next-line import/no-cycle
import { BlockView } from './BlockEditor';

export function parseReact(
  code: string,
  context: UserContextData,
  pages: ISiteItem[],
  router: NextRouter,
):
  {
    Component: React.ComponentType<any>,
    filter?: (data: any[]) => any[],
    search?: any,
    ListComponent?: React.ComponentType<any>,
  } {
  try {
    const babelCode = babel.transform(code, {
      presets: ['react', 'es2017'],
    }).code;

    const resultCode = babelCode!.replace('"use strict";', '').trim();
    const data = {
      React,
      Mui,
      Link,
      context,
      user: context.user,
      pages,
      useTableByDbName,
      router,
      Head,
      FullCalendar,
      dayGridPlugin,
      listPlugin,
      ruLocale,
      dayjs,
      useRouter,
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      FormWidget,
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      PageWidget,
      usePosts,
      usePostsByTagSlug,
      usePostsByCategorySlug,
      useTags,
      useCategories,
      BlockView,
      Register,
      Login,
    };
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const func = new Function('data', getReactTemplateDefinition('list', resultCode, data));
    return func(data);
  } catch (e) {
    return {
      Component: () => (
        <div>
          Ошибка разбора:
          <pre>{e?.toString()}</pre>
        </div>
      ),
    };
  }
}

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
