import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Editor, useMonaco } from '@monaco-editor/react';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import { RenderWidget } from './ParseWidgets';
import { getReactTemplateType } from './reactTemplates';
import useTable, { TableField } from './use-table';
import { FieldType, IField } from './entities/IField';
import { ITable } from './entities/ITable';
import { TemplateLanguage } from './entities/ITemplate';
import { WidgetViewType } from './entities/IWidget';

// Задержка рендеринга превью, милисекунды.
const RENDER_PREVIEW_DELAY = 2000;

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
          ? (
            <Editor
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
          : (
            <Editor
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

// setWidget требуется если не режим readOnly
export default function WidgetSettings({
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
    <div className="rounded p-4 shadow-lg bg-white">
      <div className="flex flex-col gap-4 py-2">
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

        {/* Превью виджета */}
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
      </div>
    </div>
  );
}
