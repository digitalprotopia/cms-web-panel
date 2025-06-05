import { gql, useMutation, useQuery } from '@apollo/client';
import { useEffect, useState } from 'react';
import {
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  ToggleButtonGroup,
  ToggleButton,
  InputLabel,
} from '@mui/material';
import { ITable } from '@/components/entities/ITable';
import dayjs from 'dayjs';
import { Editor, useMonaco } from '@monaco-editor/react';
import useTable, { TableField } from './use-table';
import { FieldType, IField } from './entities/IField';
import { RenderWidget } from './ParseWidgets';
import { TemplateLanguage } from './entities/ITemplate';
import { getReactTemplateType } from './reactTemplates';
import { WidgetViewType } from './entities/IWidget';

// draft: Consider possibility to move to the some settings place.
// Задержка рендеринга превью, милисекунды.
const RENDER_PREVIEW_DELAY = 1000;

interface WidgetEditProps {
  id?: string;
  onClose: () => void;
}

const GET_TABLES = gql`
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

function WidgetEdit({ id, onClose }: WidgetEditProps) {
  const [form, setForm] = useState({
    name: '',
    title: '',
    tableId: '',
    markup: '',
    widgetViewType: 'list',
    language: TemplateLanguage.SIMPLE,
    cssClass: '',
    style: '',
  });

  const [previewMarkup, setPreviewMarkup] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<EditionTab>(EditionTab.MARKUP);

  // Установить разметку превью равной разметке формы с заданной задержкой.
  useEffect(() => {
    const interval = setInterval(() => {
      if (previewMarkup !== form.markup) {
        setPreviewMarkup(form.markup);
      }
    }, RENDER_PREVIEW_DELAY);
    return () => clearInterval(interval);
  }, [form.markup]);

  const isEditMode = !!id;

  const { loading: widgetLoading } = useQuery(GET_WIDGET, {
    variables: { id },
    skip: !isEditMode,
    onCompleted: (data) => {
      setForm({
        name: data.getWidget.name,
        title: data.getWidget.title,
        tableId: data.getWidget.tableView.table?.id,
        markup: data.getWidget.template.html,
        widgetViewType: data.getWidget.widgetViewType,
        language: data.getWidget.template.language,
        cssClass: data.getWidget.cssClass,
        // draft: Get style from server.
        style: `h1 {color: green}
        p {color: red}
        table {color: red}
        table thead {color: blue}`,
      });
    },
  });

  const { data: tablesQuery, loading: tablesLoading } = useQuery(GET_TABLES);

  const [createWidget] = useMutation(CREATE_WIDGET);
  const [updateWidget] = useMutation(UPDATE_WIDGET);

  const widgetTable = useTable(form.tableId!);

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
    <div className="flex flex-col gap-4 py-2">
      <TextField
        label="Название"
        variant="outlined"
        fullWidth
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      <TextField
        label="Код"
        variant="outlined"
        fullWidth
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <TextField
        label="CSS class"
        variant="outlined"
        fullWidth
        value={form.cssClass}
        onChange={(e) => setForm({ ...form, cssClass: e.target.value })}
      />

      <TextField
        select
        label="Тип виджета"
        variant="outlined"
        fullWidth
        value={form.widgetViewType}
        onChange={(e) => {
          setForm({ ...form,
            widgetViewType: e.target.value,
            tableId: e.target.value === WidgetViewType.STATIC ? null as any : form.tableId });
        }}
      >
        {Object.values(WidgetViewType).map((type) => (
          <MenuItem key={type} value={type}>
            {type}
          </MenuItem>
        ))}
      </TextField>

      {form.widgetViewType !== WidgetViewType.STATIC && (
      <FormControl fullWidth variant="outlined">
        <InputLabel id="table-select-label">Выберите таблицу</InputLabel>
        <Select
          labelId="table-select-label"
          label="Выберите таблицу"
          value={form.tableId}
          onChange={(e) => setForm({ ...form, tableId: e.target.value })}
        >
          <MenuItem key={0} value={null as any}>
            Без таблицы
          </MenuItem>
          {tablesQuery?.getTables.map((table: ITable) => (
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
        value={form.language}
        onChange={(e) => setForm({ ...form, language: e.target.value as TemplateLanguage })}
      >
        {Object.values(TemplateLanguage).map((type) => (
          <MenuItem key={type} value={type}>
            {type}
          </MenuItem>
        ))}
      </TextField>

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
              value={form.markup}
              height={200}
              onChange={(value) => setForm({ ...form, markup: value! })}
              language={
                form.language === TemplateLanguage.REACT
                  ? EditorLanguage.JS
                  : EditorLanguage.HTML
              }
          />)
          : (<Editor
              value={form.style}
              height={200}
              onChange={(value) => setForm({ ...form, style: value! })}
              language={EditorLanguage.CSS}
          />)
      }

      <div style={{
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: 4,
        borderColor: 'black',
        padding: 8,
      }}
      >
        <RenderWidget
          widgetViewType={form.widgetViewType}
          html={previewMarkup}
          fields={widgetTable.meta?.fields as TableField[]}
          data={widgetTable.meta ? [row] : []}
          language={form.language}
          cssClass={form.cssClass}
          style={form.style}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {form.language === TemplateLanguage.SIMPLE
         && widgetTable.meta?.fields.map((field: IField) => (
           <Button
             key={field.id}
             variant="contained"
             color="primary"
             onClick={() => setForm({
               ...form,
               markup: `${form.markup}{${field.dbName}}`,
             })}
           >
             {`{${field.dbName}}`}
           </Button>
         ))}
        {widgetTable.meta?.fields.length === 0 && (
          <span>В таблице нет полей</span>
        )}
      </div>

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
  );
}

export default WidgetEdit;
