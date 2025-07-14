import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Editor, useMonaco } from '@monaco-editor/react';
import HistoryIcon from '@mui/icons-material/History';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

import { RenderWidget } from './ParseWidgets';
import { getReactTemplateType } from './reactTemplates';
import useTable, { TableField } from './use-table';
import WidgetHistoryDialog from './dialogs/WidgetHistoryDialog';
import { FieldType, IField } from './entities/IField';
import { ISiteItem } from './entities/ISiteItem';
import { ITable } from './entities/ITable';
import { TemplateLanguage } from './entities/ITemplate';
import { WidgetViewType } from './entities/IWidget';

// Задержка рендеринга превью, милисекунды.
const RENDER_PREVIEW_DELAY = 2000;

export const GET_TABLES = gql`
  query {
    getTables {
      id
      name
      dbName
      createdAt
    }
  }
`;

const GET_WIDGET = gql`
  query GetWidget($id: ID!) {
    getWidget(id: $id) {
      id
      name
      title
      cssClass
      createdAt
      widgetViewType
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
        language
        css
      }
      siteItems {
        id,
        title,
        site {
          id
        }
      }
    }
  }
`;

const CREATE_WIDGET = gql`
  mutation CreateWidget(
    $input: WidgetInput!
    $tableView: TableViewInput!
    $template: TemplateInput!
  ) {
    createWidget(
      input: $input
      tableViewInput: $tableView
      templateInput: $template
    ) {
      id
    }
  }
`;

const UPDATE_WIDGET = gql`
  mutation EditWidget(
    $id: ID!
    $input: WidgetInput!
    $tableView: TableViewInput!
    $template: TemplateInput!
  ) {
    editWidget(
      id: $id
      input: $input
      tableViewInput: $tableView
      templateInput: $template
    ) {
      id
    }
  }
`;

enum EditionTab {
  MARKUP = 'markup',
  STYLE = 'style',
}

// todo: Переместить в подходящий модуль если будет переиспользоваться.
enum EditorLanguage {
  CSS = 'css',
  JS = 'javascript',
  HTML = 'html',
}

function WidgetMarkupEditor({
  markup,
  setMarkup,
  style,
  setStyle,
  markupLanguage,
  readOnly = false,
}: {
  markup: string,
  setMarkup: (markup: string) => void,
  style: string,
  setStyle: (style: string) => void,
  markupLanguage: TemplateLanguage,
  readOnly?: boolean,
}) {
  const [selectedTab, setSelectedTab] = useState<EditionTab>(EditionTab.MARKUP);

  const EDITOR_HEIGHT = 200;

  return (
    <div>
      <ToggleButtonGroup
        value={selectedTab}
        onChange={(_, value) => { setSelectedTab(value); }}
        exclusive
      >
        <ToggleButton value={EditionTab.MARKUP}>Разметка</ToggleButton>
        <ToggleButton value={EditionTab.STYLE}>Стиль</ToggleButton>
      </ToggleButtonGroup>
      {
        selectedTab === EditionTab.MARKUP
          ? (<Editor
              key="markup"
              value={markup}
              height={EDITOR_HEIGHT}
              /*
              fixme: Удалить надпись "Cannot edit in read-only editor" при
                попытке редактирования. */
              options={{ readOnly }}
              onChange={(value) => setMarkup(value!)}
              language={
                markupLanguage === TemplateLanguage.REACT
                  ? EditorLanguage.JS
                  : EditorLanguage.HTML
              }
          />)
          : (<Editor
              key="style"
              value={style}
              height={EDITOR_HEIGHT}
              options={{ readOnly }}
              onChange={(value) => setStyle(value!)}
              language={EditorLanguage.CSS}
          />)
      }
    </div>
  );
}

interface WidgetAddEditPageProps {
  id?: string;
  onClose: () => void;
}

/*
todo: Переименовать в IWidget и/или переместить в entities,
  после рефакторинга IWidget */
interface IForm {
  name: string,
  title: string,
  tableId: string,
  markup: string,
  widgetId: string,
  widgetViewType: string,
  language: TemplateLanguage,
  cssClass: string,
  style: string,
}

// Используется не ISiteItem, т.к. в SiteItem url неявно это имя последнего
//  сегмента пути (path), а в IUsingPage urlPath это весь url путь (path).
interface IUsingPage {
  title: string,
  urlPath: string,
}

// Ссылки на страницы которые используют виждет.
function PageLinks({ usingPages }: { usingPages: IUsingPage[] }) {
  const pageLinks = usingPages.map(({ title, urlPath }, index) => (
    <Box>
      <Link
        key={index}
        href={urlPath}
        target="_blank"
        rel="noopener noreferrer"
      >
        {title}
      </Link>
    </Box>
  ));

  return (
    <div>
      {
        pageLinks.length === 0
          ? <Typography component="span">Не используется на страницах</Typography>
          : (
            <Accordion>
              <AccordionSummary
                expandIcon={<ArrowDropDownIcon />}
                aria-controls="using-pages-content"
                id="using-pages-header"
              >
                <Typography component="span">Используется на страницах</Typography>
              </AccordionSummary>
              <AccordionDetails>{ pageLinks }</AccordionDetails>
            </Accordion>
          )
      }
    </div>
  );
}

// setWidget требуется если не режим readOnly
export function WidgetSettingsWithRepresentation({
  widget,
  // WIP: change to setWidget default () => {} and readOnly = true
  setWidget,
  readOnly = false,
  tables,
}: {
  widget: IForm,
  setWidget: (widget: IForm | ((...args: any[]) => IForm)) => void,
  readOnly?: boolean,
  tables: ITable[]
}) {
  const setStyle = (style: string) => { setWidget((prev) => ({ ...prev, style })); };
  const setMarkup = (markup: string) => { setWidget((prev) => ({ ...prev, markup })); };

  const [previewMarkup, setPreviewMarkup] = useState<string>('');
  const [previewStyle, setPreviewStyle] = useState<string>('');

  // Установить (с заданной задержкой) разметку превью равной разметке формы.
  useEffect(() => {
    const interval = setInterval(() => {
      if (previewMarkup !== widget.markup) {
        setPreviewMarkup(widget.markup);
      }
    }, RENDER_PREVIEW_DELAY);
    return () => clearInterval(interval);
  }, [widget.markup]);

  // Установить (с заданной задержкой) стиль превью равный стилю формы.
  useEffect(() => {
    const interval = setInterval(() => {
      if (previewStyle !== widget.style) {
        setPreviewStyle(widget.style);
      }
    }, RENDER_PREVIEW_DELAY);
    return () => clearInterval(interval);
  }, [widget.style]);

  const widgetTable = useTable(widget.tableId!);

  const row = widgetTable.data?.[0] || {};
  widgetTable.meta?.fields.forEach((field: IField) => {
    if (field.type === FieldType.DATE_TIME) {
      row[field.dbName] = dayjs(row[field.dbName]).format('YYYY-MM-DD HH:mm');
    }
    if (field.type === FieldType.BOOLEAN) {
      row[field.dbName] = row[field.dbName] ? 'Да' : 'Нет';
    }
  });

  return (
    <>
      <TextField
        label="Название"
        variant="outlined"
        fullWidth
        value={widget.title}
        disabled={readOnly}
        onChange={(e) => setWidget({ ...widget, title: e.target.value })}
        slotProps={{
          htmlInput: { maxLength: 255 },
        }}

      />

      <TextField
        label="Код"
        variant="outlined"
        fullWidth
        value={widget.name}
        disabled={readOnly}
        onChange={(e) => setWidget({ ...widget, name: e.target.value })}
        slotProps={{
          htmlInput: { maxLength: 255 },
        }}

      />

      <TextField
        label="CSS class"
        variant="outlined"
        fullWidth
        value={widget.cssClass}
        disabled={readOnly}
        onChange={(e) => setWidget({ ...widget, cssClass: e.target.value })}
      />

      <TextField
        select
        label="Тип виджета"
        variant="outlined"
        fullWidth
        value={widget.widgetViewType}
        disabled={readOnly}
        onChange={(e) => {
          setWidget({ ...widget,
            widgetViewType: e.target.value,
            tableId: e.target.value === WidgetViewType.STATIC ? null as any : widget.tableId });
        }}
      >
        {Object.values(WidgetViewType).map((type) => (
          <MenuItem key={type} value={type}>
            {type}
          </MenuItem>
        ))}
      </TextField>

      {widget.widgetViewType !== WidgetViewType.STATIC && (
      <FormControl fullWidth variant="outlined">
        <InputLabel id="table-select-label">Выберите таблицу</InputLabel>
        <Select
          labelId="table-select-label"
          label="Выберите таблицу"
          value={widget.tableId}
          disabled={readOnly}
          onChange={(e) => setWidget({ ...widget, tableId: e.target.value })}
        >
          <MenuItem key={0} value={null as any}>
            Без таблицы
          </MenuItem>
          {tables.map((table: ITable) => (
            <MenuItem key={table.id} value={table.id}>
              {table.name}
              {' '}
              (
              {table.dbName}
              )
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      )}

      <TextField
        select
        label="Язык"
        variant="outlined"
        fullWidth
        value={widget.language}
        disabled={readOnly}
        onChange={(e) => setWidget({ ...widget, language: e.target.value as TemplateLanguage })}
      >
        {Object.values(TemplateLanguage).map((type) => (
          <MenuItem key={type} value={type}>
            {type}
          </MenuItem>
        ))}
      </TextField>

      {/* Редактор разметки и стиля. */}
      <WidgetMarkupEditor
        markup={widget.markup}
        setMarkup={setMarkup}
        style={widget.style}
        setStyle={setStyle}
        markupLanguage={widget.language}
        readOnly={readOnly}
      />

      <div style={{
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: 4,
        borderColor: 'black',
        padding: 8,
      }}
      >
        <RenderWidget
          widgetId={widget.widgetId}
          widgetViewType={widget.widgetViewType}
          html={previewMarkup}
          fields={widgetTable.meta?.fields as TableField[]}
          data={widgetTable.meta ? [row] : []}
          language={widget.language}
          cssClass={widget.cssClass}
          style={previewStyle}
        />
      </div>

      {readOnly || (
        <div className="flex flex-wrap gap-2">
          {widget.language === TemplateLanguage.SIMPLE
              && widgetTable.meta?.fields.map((field: IField) => (
                <Button
                  key={field.id}
                  variant="contained"
                  color="primary"
                  onClick={() => setWidget({
                    ...widget,
                    markup: `${widget.markup}{${field.dbName}}`,
                  })}
                >
                  {`{${field.dbName}}`}
                </Button>
              ))}
          {widgetTable.meta?.fields.length === 0 && (
            <span>В таблице нет полей</span>
          )}
        </div>
      )}
    </>
  );
}

// Добавить новый виджет если id не передан.
// Изменить виджет если id передан.
function WidgetAddEditPage({ id, onClose }: WidgetAddEditPageProps) {
  const [form, setForm] = useState<IForm>({
    name: '',
    title: '',
    tableId: '',
    markup: '',
    widgetId: '',
    widgetViewType: 'list',
    language: TemplateLanguage.SIMPLE,
    cssClass: '',
    style: '',
  });

  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const [usingPages, setUsingPages] = useState<IUsingPage[]>([]);

  const isEditMode = !!id;

  const { loading: widgetLoading } = useQuery(GET_WIDGET, {
    variables: { id },
    skip: !isEditMode,
    onCompleted: (data) => {
      // Обновить данные виджета.
      setForm({
        name: data.getWidget.name,
        title: data.getWidget.title,
        tableId: data.getWidget.tableView.table?.id,
        markup: data.getWidget.template.html,
        widgetId: data.getWidget.id,
        widgetViewType: data.getWidget.widgetViewType,
        language: data.getWidget.template.language,
        cssClass: data.getWidget.cssClass,
        style: data.getWidget.template.css,
      });

      // Обновить данные страниц использующих виджет.
      setUsingPages(data.getWidget.siteItems.map(
        (siteItem: ISiteItem): IUsingPage => ({
          title: siteItem.title,
          urlPath: `/admin/sites/${siteItem.site.id}/pages/${siteItem.id}`,
        }),
      ));
    },
  });

  const { data: tablesData, loading: tablesLoading } = useQuery(GET_TABLES);

  const [createWidget] = useMutation(CREATE_WIDGET);
  const [updateWidget] = useMutation(UPDATE_WIDGET);

  const monaco = useMonaco();
  useEffect(() => {
    if (!monaco) {
      return;
    }
    // extra libraries
    const libSource = getReactTemplateType('list');
    const libUri = 'ts:filename/facts.d.ts';
    monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, libUri);
    if (monaco.languages.typescript.javascriptDefaults.getExtraLibs()[libUri]) {
      return;
    }
    // When resolving definitions and references, the editor will try to use created models.
    // Creating a model for the library allows
    // "peek definition/references" commands to work with the library.
    monaco.editor.createModel(libSource, 'typescript', monaco.Uri.parse(libUri));
  }, [monaco]);

  if ((isEditMode && widgetLoading && tablesLoading) || tablesLoading) {
    return <div>Loading...</div>;
  }

  const handleSave = () => {
    const variables = {
      input: {
        name: form.name,
        title: form.title,
        widgetViewType: form.widgetViewType,
        cssClass: form.cssClass,
      },
      tableView: {
        title: form.title,
        name: form.name,
        tableId: form.tableId,
      },
      template: {
        title: form.title,
        html: form.markup,
        language: form.language,
        css: form.style,
      },
    };

    if (isEditMode) {
      updateWidget({ variables: { id, ...variables } }).then(() => {
        onClose();
      });
    } else {
      createWidget({ variables }).then(() => {
        onClose();
      });
    }
  };

  return (
    <>
      <div className="rounded p-4 shadow-lg bg-white">
        {/* Заголовок */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">
            { isEditMode ? 'Редактировать виджет' : 'Добавить виджет'}
          </Typography>
          {isEditMode && (
            <IconButton
              color="secondary"
              aria-label="История изменений"
              onClick={() => setIsHistoryDialogOpen(true)}
              sx={{
                color: 'black',
                '&:hover': {
                  backgroundColor: 'rgba(233, 30, 99, 0.1)',
                },
              }}
            >
              <HistoryIcon />
            </IconButton>
          )}
        </Stack>

        <div className="flex flex-col gap-4 py-2">
          {/* Основная часть */}
          <WidgetSettingsWithRepresentation
            widget={form}
            setWidget={setForm}
            tables={tablesData?.getTables}
          />

          <PageLinks
            usingPages={usingPages}
          />

          {/* Панель кнопок */}
          <div className="flex gap-4">
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={
                !form.name || !form.title! || !form.markup
                // || (form.widgetViewType !== WidgetViewType.STATIC && !form.tableId)
              }
            >
              {isEditMode ? 'Сохранить' : 'Создать'}
            </Button>
            <Button variant="contained" onClick={onClose}>Отмена</Button>
          </div>
        </div>
      </div>

      {isEditMode && (
        <WidgetHistoryDialog
          isOpen={isHistoryDialogOpen}
          widgetId={id as string}
          onClose={() => setIsHistoryDialogOpen(false)}
        />
      )}
    </>
  );
}

export default WidgetAddEditPage;
