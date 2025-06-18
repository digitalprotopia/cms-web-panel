import {
  gql, useApolloClient, useLazyQuery, useMutation, useQuery,
} from '@apollo/client';
import React, { useContext, useEffect, useState } from 'react';
import { useRouter, NextRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { Button, Typography } from '@mui/material';
import { createPortal } from 'react-dom';
import { ErrorBoundary } from 'react-error-boundary';
import {
  Map, useYMaps,
} from '@pbe/react-yandex-maps';
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
// eslint-disable-next-line import/no-cycle
import FormField from './form';
import useTable, {
  TableField, useAddRow, useCategories, useEditRow, usePosts,
  usePostsByCategorySlug, usePostsByTagSlug, useSiteMenu, useTableByDbName,
  UseTableOptions, useTags,
} from './use-table';
import { TemplateLanguage } from './entities/ITemplate';
import DynamicParse from './DynamicParse';
import UserContext, { UserContextData } from './UserContext';

import { ISiteItem } from './entities/ISiteItem';
import { getReactTemplateDefinition } from './reactTemplates';
// eslint-disable-next-line import/no-cycle
import { BlockView } from './BlockEditor';
import { WidgetViewType } from './entities/IWidget';
import { usePageContext } from './PageContext';
import { FormType } from './entities/IForm';

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
    params?: UseTableOptions,
    ListComponent?: React.ComponentType<any>,
    getColor?: (row: any) => string,
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
      useQuery,
      useMutation,
      gql,
      useLazyQuery,
      useApolloClient,
      useSiteMenu,
      usePageContext,
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
    if (
      field.type === FieldType.ONE_TO_MANY_MANY
      || field.type === FieldType.MANY_TO_MANY_FIRST
      || field.type === FieldType.MANY_TO_MANY_SECOND
    ) {
      resultRow[field.dbName] = row[field.dbName]
        ? row[field.dbName].map((r: any) => r._cms_title).join(', ')
        : null;
    }
    if (field.type === FieldType.HTML) {
      resultRow[field.dbName] = (
        <div
          dangerouslySetInnerHTML={{ __html: row[field.dbName] }}
        />
      );
    }
    if (field.type === FieldType.BLOCK) {
      resultRow[field.dbName] = <BlockView blockContent={row[field.dbName]} />;
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

function MapComponent(props: {
  data: any[],
  getColor?: (row: any) => string,
  getCoords: (row: any) => { lat: number, lng: number } | null,
  id: string,
  fields: TableField[],
  html: string,
  language: TemplateLanguage,
  mapCenter?: { lat: number, lng: number },
  zoom?: number,
  width?: any,
  height?: any,
}) {
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

  const ymapsRef = useYMaps();
  const [mapCreate, setMapCreate] = useState(false);
  if (!ymapsRef) {
    return null;
  }

  return (
    <div
      style={{ minHeight: props.height || 400 }}
    >
      <Map
        defaultState={{
          center: props.mapCenter
            ? [props.mapCenter.lat, props.mapCenter.lng]
            : [55.751574, 37.573856],
          zoom: props.zoom || 10,
        }}
        height={props.height || 400}
        width={props.width || '100%'}
        modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
        instanceRef={(ref) => {
          if (ymapsRef && props.data && props.data.length && ref && !mapCreate) {
            console.log('ref fired');
            setMapCreate(true);
            // ref.balloon.events.add()
            const objectManager = new ymapsRef.ObjectManager({

              clusterize: true,
              clusterIconLayout: 'default#pieChart',
              // @ts-expect-error types
              clusterIconPieChartRadius: 25,
              clusterIconPieChartCoreRadius: 15,
              clusterIconPieChartStrokeWidth: 3,
              clusterHideIconOnBalloonOpen: false,
              // hasBalloon: false,
              clusterDisableClickZoom: true,
              clusterOpenBalloonOnClick: true,
              clusterBalloonContentLayout: 'cluster#balloonCarousel',
              // clusterBalloonItemContentLayout: customItemContentLayout,
              // Устанавливаем режим открытия балуна.
              // В данном примере балун никогда не будет открываться в режиме панели.
              clusterBalloonPanelMaxMapArea: 0,
              // Устанавливаем размеры макета контента балуна (в пикселях).
              clusterBalloonContentLayoutWidth: 420,
              clusterBalloonContentLayoutHeight: 200,
              // Устанавливаем максимальное количество элементов в нижней панели на одной странице
              // clusterBalloonPagerSize: 5,

            });

            const placemarks = props.data.map((row: any) => {
              const coords = props.getCoords(row);
              if (!coords) {
                return null;
              }
              return {
                id: row.id,
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates:
              [coords.lat, coords.lng],
                },
                properties:
              {
                balloonContent: `<div id="${row.id}${props.id}" style="width: 400px; height: 200px; overflow: auto;">
                  </div>`,
                elementId: `${row.id}${props.id}`,
                rowId: row.id,
              },
                options:
              {
                iconColor: props.getColor
                  ? props.getColor(row)
                  : 'green',
              },
              };
              // ref.geoObjects.add(placemark);
            }).filter((p: any) => p !== null);
            objectManager.add({ type: 'FeatureCollection', features: placemarks });
            objectManager.clusters.state.events.add('change', () => {
              // @ts-expect-error types
              const newActiveObjects = objectManager.clusters.state.get('activeObject');
              // console.log(newActiveObjects);
              if (!newActiveObjects) {
                return;
              }
              setPortal({
                open: true,
                // @ts-expect-error types
                portalId: newActiveObjects.properties.elementId,
                // @ts-expect-error types
                rowId: newActiveObjects.properties.rowId,
                // balloon: e.get('target').balloon,
              });
            });
            ref.geoObjects.add(objectManager);
            // ref.geoObjects.add(placemarks);
            ref.geoObjects.events.add('balloonopen', (e) => {
              if (e.get('target').getData().properties.rowId) {
                setPortal({
                  open: true,
                  portalId: e.get('target').getData().properties.elementId,
                  rowId: e.get('target').getData().properties.rowId,
                  // balloon: e.get('target').balloon,
                });
              }
            });
            ref.geoObjects.events.add('balloonclose', () => {
              setPortal({ ...portal, open: false });
            });
          }
        }}
      />
      {portal.open && (
      <Portal elementId={portal.portalId}>
        <div style={{
          overflow: 'auto',
        }}
        >
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
}

const WidgetMap:React.FC<{ data: any, fields: TableField[], html: string,
  language?: TemplateLanguage
}> = function (props) {
  // console.log(customItemContentLayout.events);

  const user = useContext(UserContext);
  const router = useRouter();

  const field = props.fields?.find((f) => f.type === FieldType.GEO);

  const mapProps = {
    getCoords: (row: any) => {
      if (!field || !row[field.dbName]) {
        return null;
      }
      return row[field.dbName];
    },
    id: field?.dbName || '',
    data: props.data,
    fields: props.fields,
    html: props.html,
    language: props.language || TemplateLanguage.SIMPLE,
  };

  if (props.language === TemplateLanguage.REACT) {
    const { ListComponent } = parseReact(props.html, user, user.pages!, router);
    if (ListComponent) {
      return (
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <div>
              Ошибка разбора:
              <pre>{error?.message}</pre>
            </div>
          )}
          resetKeys={[props.html]}
          onError={(err) => { console.log(err); }}
        >
          {/* eslint-disable-next-line react/jsx-no-bind */}
          <ListComponent MapComponent={MapComponent} mapProps={mapProps} data={props.data} />
        </ErrorBoundary>
      );
    }
  }

  return <MapComponent {...mapProps} />;
};

// Применить стиль к дочернему компоненту.
// Если передан style props применить класс `widget-${widgetId}` к потомку.
function WidgetStyle(
  props: {
    children: React.JSX.Element,
    cssClass?: string,
    style?: string,
    widgetId: string,
  },
) {
  return (
    <>
      <style>
        {props.style || undefined}
      </style>
      <div className={props.cssClass || undefined}>
        {props.style
          ? (<div className={`widget-${props.widgetId}`}>
            {props.children}
             </div>)
          : props.children}
      </div>
    </>
  );
}

export function RenderWidget(
  props: {
    widgetId: string,
    widgetViewType: string,
    html: string,
    fields: TableField[],
    data: any,
    language: TemplateLanguage,
    cssClass: string,
    style?: string,
  },
) {
  const {
    widgetId, widgetViewType, html, fields, data, language,
  } = props;
  const user = useContext(UserContext);
  const router = useRouter();

  if (widgetViewType === WidgetViewType.MAP) {
    return (
      <WidgetStyle cssClass={props.cssClass} style={props.style} widgetId={widgetId}>
        <WidgetMap
          data={data}
          fields={fields}
          html={html}
          language={language}
        />
      </WidgetStyle>
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
          <WidgetStyle cssClass={props.cssClass} style={props.style} widgetId={widgetId}>
            <template.ListComponent data={data} Component={template.Component} />
          </WidgetStyle>
        </ErrorBoundary>
      );
    }
  }
  if (language === TemplateLanguage.SIMPLE && widgetViewType === WidgetViewType.STATIC) {
    return (
      <WidgetStyle cssClass={props.cssClass} style={props.style} widgetId={widgetId}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </WidgetStyle>
    );
  }
  return (
    <WidgetStyle cssClass={props.cssClass} style={props.style} widgetId={widgetId}>
      <WidgetList
        data={data}
        fields={fields}
        html={html}
        language={language}
      />
    </WidgetStyle>
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
                  cssClass
                  template {
                      html
                      language
                      css
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

  let filter: ReturnType<typeof parseReact>['filter'];
  let params: UseTableOptions = {};
  if (data && data.getWidgetByName?.template.language === TemplateLanguage.REACT) {
    const widget = parseReact(
      data.getWidgetByName.template.html,
      user,
      user.pages || [],
      router,
    );
    filter = widget.filter;
    if (widget.search) {
      params.search = widget.search;
    }
    if (widget.params) {
      params = widget.params;
    }
  }

  const table = useTable(data?.getWidgetByName?.tableView.tableId, params);

  if (!data || !data?.getWidgetByName || (data?.getWidgetByName.tableView.tableId && !table.data)) {
    return null;
    return (
      <div
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'center',
        }}
      >
        <Mui.CircularProgress />
      </div>
    );
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
      widgetId={data.getWidgetByName.id}
      widgetViewType={data.getWidgetByName.widgetViewType}
      html={data.getWidgetByName.template.html}
      fields={table.meta?.fields as TableField[]}
      data={resultData}
      language={data.getWidgetByName.template.language}
      cssClass={data.getWidgetByName.cssClass || ''}
      style={data.getWidgetByName.template.css}
    />
  );
}

export function FormWidget(props: {
  formName: string;
  id?: string;
  input?: any;
}) {
  const [form, setForm] = useState<any>({});
  const { data } = useQuery(gql`
              query($name: String!) {
                  getFormByName(name: $name) {
                      id
                      name
                      type
                      title
                      cssClass
                      createdAt
                      fields {
                          id
                          title
                          name
                          description
                          position
                          tableFieldId
                          formFieldType
                          cssClass
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
  console.log(data?.getFormByName.type);
  useTable((props.id && data?.getFormByName.type === FormType.EDIT)
    ? data?.getFormByName.table.id : null, {
    search: {
      id: {
        query: [props.id],
      },
    },
    onDataLoaded(tableData) {
      console.log(tableData);
      if (tableData.length) {
        const _form = JSON.parse(JSON.stringify(form));
        data.getFormByName.fields.forEach((field: any) => {
          if (field.field.type === FieldType.ONE_TO_MANY_ONE
            || field.field.type === FieldType.USER
          ) {
            _form[field.field.dbName] = tableData[0][field.field.dbName]?.id;
          } else if (field.field.type === FieldType.ONE_TO_MANY_MANY
            || field.field.type === FieldType.MANY_TO_MANY_FIRST
            || field.field.type === FieldType.MANY_TO_MANY_SECOND
          ) {
            _form[field.field.dbName] = tableData[0][field.field.dbName]?.map((r: any) => r.id);
          } else {
            _form[field.field.dbName] = tableData[0][field.field.dbName];
          }
        });
        setForm(_form);
      }
    },
  });
  const addRow = useAddRow(data?.getFormByName.table.dbName);
  const editRow = useEditRow(data?.getFormByName.table.dbName);
  const { enqueueSnackbar } = useSnackbar();
  if (!data?.getFormByName) {
    return null;
  }

  const fields = [...data.getFormByName.fields];
  fields.sort((a: any, b: any) => a.position - b.position);

  return (
    <div className={data.getFormByName.cssClass || undefined}>
      <Typography variant="h4">{data.getFormByName.title}</Typography>
      <div>
        {data.getFormByName.fields.map((field: any) => {
          const fieldComponent = (
            <div className={`mmcms-form-field mmcms-form-field-type-${field.field.type}`}>
              <FormField
                title={field.title}
                field={field.field}
                value={form[field.field.dbName]}
                onChange={(value) => setForm({ ...form, [field.field.dbName]: value })}
              />
              <div className="mmcms-form-field-description">{field.description}</div>
            </div>
          );

          return (
            <div key={field.id} className={field.cssClass || undefined}>
              {fieldComponent}
            </div>
          );
        })}
      </div>
      <div>
        <Button onClick={async () => {
          const _form:any = {};
          if (data.getFormByName.type === 'edit') {
            await editRow(props.id!, { ...form, ...(props.input || {}) });
          } else {
            await addRow({ ...form, ...(props.input || {}) });
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
          }
          enqueueSnackbar('Форма отправлена', { variant: 'success' });
        }}
        >
          Отправить

        </Button>
      </div>
    </div>
  );
}
