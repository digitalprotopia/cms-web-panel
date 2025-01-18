import { gql, useMutation, useQuery } from '@apollo/client';
import React, { useContext, useEffect, useState } from 'react';
import { useRouter, NextRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import { Button, IconButton, Typography } from '@mui/material';
import { createPortal } from 'react-dom';
import { ErrorBoundary } from 'react-error-boundary';
import {
  Clusterer, Map, Placemark, useYMaps, YMaps,
} from '@pbe/react-yandex-maps';
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
      useQuery,
      useMutation,
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

  const placemarkColors = [
    '#DB425A', '#4C4DA2', '#00DEAD', '#D73AD2',
    '#F8CC4D', '#F88D00', '#AC646C', '#548FB7',
  ];
  const ymapsRef = useYMaps();
  if (!ymapsRef) {
    return null;
  }
  const customItemContentLayout = ymapsRef!.templateLayoutFactory.createClass(
    // Флаг "raw" означает, что данные вставляют "как есть" без экранирования html.
    '<h2 class=ballon_header>{{ properties.balloonContentHeader|raw }}</h2>'
        + '<div class=ballon_body>{{ properties.balloonContentBody|raw }}</div>'
        + '<div class=ballon_footer>{{ properties.balloonContentFooter|raw }}</div>',
  );

  // console.log(customItemContentLayout.events);

  return (
    <div
      style={{ minHeight: 400 }}
      ref={(target) => {
        if (!target) {
          return;
        }
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.textContent) {
                // console.log(node.nodeName);
                // console.log(node.textContent);
              }
            });
          });
        });
        observer.observe(target, { childList: true, subtree: true });
      }}
    >
      <style>
        {`
            .ymaps-2-1-79-balloon__layout {
              #width: 0px;
            }
          `}
      </style>
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
            // console.log(ref);
            // ref.balloon.events.add()
            const objectManager = new ymapsRef.ObjectManager({

              clusterize: true,
              clusterIconLayout: 'default#pieChart',
              clusterIconPieChartRadius: 25,
              clusterIconPieChartCoreRadius: 15,
              clusterIconPieChartStrokeWidth: 3,
              // hasBalloon: false,
              clusterDisableClickZoom: true,
              clusterOpenBalloonOnClick: true,
              clusterBalloonContentLayout: 'cluster#balloonCarousel',
              // clusterBalloonItemContentLayout: customItemContentLayout,
              // Устанавливаем режим открытия балуна.
              // В данном примере балун никогда не будет открываться в режиме панели.
              clusterBalloonPanelMaxMapArea: 0,
              // Устанавливаем размеры макета контента балуна (в пикселях).
              clusterBalloonContentLayoutWidth: 400,
              clusterBalloonContentLayoutHeight: 130,
              // Устанавливаем максимальное количество элементов в нижней панели на одной странице
              clusterBalloonPagerSize: 5,

            });

            const placemarks = props.data.map((row: any) => {
              const field = props.fields.find((f) => f.type === FieldType.GEO);
              if (!field || !row[field.dbName]) {
                return null;
              }
              return {
                id: row.id,
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates:
                [row[field.dbName].lat, row[field.dbName].lng],
                },
                properties:
                {
                  balloonContent: `<div id="${row.id}${field.dbName}" style="width: 400px; height: 200px; overflow: auto;">
                    </div>`,
                  elementId: `${row.id}${field.dbName}`,
                  rowId: row.id,
                },
                options:
                {
                  iconColor: placemarkColors[Math.floor(Math.random() * placemarkColors.length)],
                },
              };
              // ref.geoObjects.add(placemark);
            }).filter((p) => p !== null);
            objectManager.add({ type: 'FeatureCollection', features: placemarks });
            objectManager.clusters.state.events.add('change', () => {
              const newActiveObjects = objectManager.clusters.state.get('activeObject');
              // console.log(newActiveObjects);
              if (!newActiveObjects) {
                return;
              }
              setPortal({
                open: true,
                portalId: newActiveObjects.properties.elementId,
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
              // setPortal({ ...portal, open: false });
            });
          }
        }}
      >
        {/* <Clusterer
          options={{
            clusterIconLayout: 'default#pieChart',
            clusterIconPieChartRadius: 25,
            clusterIconPieChartCoreRadius: 15,
            clusterIconPieChartStrokeWidth: 3,
            // hasBalloon: false,
            clusterDisableClickZoom: true,
            clusterOpenBalloonOnClick: true,
            clusterBalloonContentLayout: 'cluster#balloonCarousel',
            // clusterBalloonItemContentLayout: customItemContentLayout,
            // Устанавливаем режим открытия балуна.
            // В данном примере балун никогда не будет открываться в режиме панели.
            clusterBalloonPanelMaxMapArea: 0,
            // Устанавливаем размеры макета контента балуна (в пикселях).
            clusterBalloonContentLayoutWidth: 200,
            clusterBalloonContentLayoutHeight: 130,
            // Устанавливаем максимальное количество элементов в нижней панели на одной странице
            clusterBalloonPagerSize: 5,
          }}
          instanceRef={(ref) => {
            if (ref) {
              // console.log(ref);
              ref.events.add(['click', 'change'], (e) => {
                // console.log(e)
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
                  balloonContent: `<div class="id-${row.id}${field.dbName}" style="position: fixed;">
                  id-${row.id}${field.dbName}
                  <script>console.log('${row.id}${field.dbName}')</script>
                  </div>`,
                  elementId: `${row.id}${field.dbName}`,
                  rowId: row.id,
                }}
                options={{
                  iconColor: placemarkColors[Math.floor(Math.random() * placemarkColors.length)],
                }}
              />
            );
          })}
        </Clusterer> */}
      </Map>
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
};

export function RenderWidget(
  props: {
    widgetViewType: string,
    html: string,
    fields: TableField[],
    data: any,
    language: TemplateLanguage,
    cssClass: string,
  },
) {
  const {
    widgetViewType, html, fields, data, language,
  } = props;
  const user = useContext(UserContext);
  const router = useRouter();
  if (widgetViewType === 'map') {
    return (
      <div className={props.cssClass || undefined}>
        <WidgetMap
          data={data}
          fields={fields}
          html={html}
          language={language}
        />
      </div>
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
          <div className={props.cssClass || undefined}>
            <template.ListComponent data={data} Component={template.Component} />
          </div>
        </ErrorBoundary>
      );
    }
  }
  return (
    <div className={props.cssClass || undefined}>
      <WidgetList
        data={data}
        fields={fields}
        html={html}
        language={language}
      />
    </div>
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
      widgetViewType={data.getWidgetByName.widgetViewType}
      html={data.getWidgetByName.template.html}
      fields={table.meta?.fields as TableField[]}
      data={resultData}
      language={data.getWidgetByName.template.language}
      cssClass={data.getWidgetByName.cssClass || ''}
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
                      cssClass
                      createdAt
                      fields {
                          id
                          title
                          name
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
  const addRow = useAddRow(data?.getFormByName.table.dbName);
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
            <FormField
              title={field.title}
              field={field.field}
              value={form[field.field.dbName]}
              onChange={(value) => setForm({ ...form, [field.field.dbName]: value })}
            />
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
