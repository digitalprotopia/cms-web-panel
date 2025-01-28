import { gql, useMutation, useQuery } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';
import {
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
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
import FramePreview from './FramePreview';

interface WidgetEditProps {
  id?: string;
  tableId?: string;
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

function WidgetEdit({ id, tableId, onClose }: WidgetEditProps) {
  const [form, setForm] = useState({
    name: '',
    title: '',
    tableId: tableId || null,
    templateHtml: '',
    widgetViewType: 'list',
    language: TemplateLanguage.SIMPLE,
    cssClass: '',
  });

  const cachedHtmlRef = useRef<string>('');
  const [cachedHtml, setCachedHtml] = useState<string>('');

  useEffect(() => {
    const interval = setInterval(() => {
      if (cachedHtmlRef.current !== cachedHtml) {
        setCachedHtml(cachedHtmlRef.current);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    cachedHtmlRef.current = form.templateHtml;
  }, [form.templateHtml]);

  const [previewMode, setPreviewMode] = useState<'widget' | 'iframe'>('widget');

  const isEditMode = !!id;

  const { loading: widgetLoading } = useQuery(GET_WIDGET, {
    variables: { id },
    skip: !isEditMode,
    onCompleted: (data) => {
      setForm({
        name: data.getWidget.name,
        title: data.getWidget.title,
        tableId: data.getWidget.tableView.table?.id,
        templateHtml: data.getWidget.template.html,
        widgetViewType: data.getWidget.widgetViewType,
        language: data.getWidget.template.language,
        cssClass: data.getWidget.cssClass,
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
        html: form.templateHtml,
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
            tableId: e.target.value === WidgetViewType.STATIC ? null : form.tableId });
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

      {form.language === TemplateLanguage.REACT
        ? (
          <Editor
            value={form.templateHtml}
            height={200}
            onChange={(value) => setForm({ ...form, templateHtml: value! })}
            language="javascript"
          />
        )
        : (
          <Editor
            value={form.templateHtml}
            height={200}
            onChange={(value) => setForm({ ...form, templateHtml: value! })}
            language="html"
          />
        )}

      <div style={{
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: 4,
        borderColor: 'black',
        padding: 8,
      }}
      >
        <div>
          <ToggleButtonGroup
            value={previewMode}
            exclusive
            onChange={(_, value) => setPreviewMode(value)}
          >
            <ToggleButton value="widget">Widget</ToggleButton>
            <ToggleButton value="iframe">Iframe</ToggleButton>
          </ToggleButtonGroup>
        </div>
        {previewMode === 'iframe' ? (
          <FramePreview>
            <RenderWidget
              widgetViewType={form.widgetViewType}
              html={cachedHtml}
              fields={widgetTable.meta?.fields as TableField[]}
              data={widgetTable.meta ? [row] : []}
              language={form.language}
              cssClass={form.cssClass}
            />
          </FramePreview>
        ) : (
          <RenderWidget
            widgetViewType={form.widgetViewType}
            html={cachedHtml}
            fields={widgetTable.meta?.fields as TableField[]}
            data={widgetTable.meta ? [row] : []}
            language={form.language}
            cssClass={form.cssClass}
          />
        )}
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
               templateHtml: `${form.templateHtml}{${field.dbName}}`,
             })}
           >
             {`{${field.dbName}}`}
           </Button>
         ))}
        {widgetTable.meta?.fields.length === 0 && (
          <span>В таблице нет полей</span>
        )}
      </div>

      <Button
        variant="contained"
        className="w-full mt-4"
        onClick={handleSave}
        disabled={
          !form.name || !form.title! || !form.templateHtml
          || (form.widgetViewType !== WidgetViewType.STATIC && !form.tableId)
        }
      >
        {isEditMode ? 'Сохранить' : 'Создать'}
      </Button>
    </div>
  );
}

export default WidgetEdit;
