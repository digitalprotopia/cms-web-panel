import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import dayjs from 'dayjs';
import { gql, useQuery } from '@apollo/client';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  DatePicker, DateTimePicker, LocalizationProvider, TimePicker,
} from '@mui/x-date-pickers';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { MaterialReactTable } from 'material-react-table';
import {
  YMaps, Map, FullscreenControl, Placemark, SearchControl,
} from '@pbe/react-yandex-maps';
import { MuiColorInput } from 'mui-color-input';
import { Editor } from '@monaco-editor/react';
import BlockEditor from '@/components/BlockEditor';
import { FieldType } from './entities/IField';
import useTable, { TableField } from './use-table';
import S3Autocomplete from './guiElements/S3Autocomplete';
import { IUser } from './entities/IUser';
import 'dayjs/locale/ru';
import { IFile } from './entities/IFile';

export const toBase64 = (file: File):Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result?.toString().replace(/^data:(.*,)?/, '') as string);
  reader.onerror = reject;
});

interface FormFieldProps {
  title: string;
  field: TableField;
  value: any;
  onChange: (value: any) => void;
}

function FormFieldFile(props: FormFieldProps) {
  const router = useRouter();
  const { loading, data } = useQuery(gql`
    query {
      getFiles {
        id
        name
        size
        extension
        createdAt
        updatedAt
      }
    }
  `);

  const [selectedFile, setSelectedFile] = useState<Partial<IFile>>({});

  const [openFileDialog, setOpenFileDialog] = useState(false);

  const [formType, setFormType] = useState<'id' | 'file'>('file');

  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        size: 400,
      },
      {
        accessorKey: 'name',
        header: 'Имя',
        size: 150,
      },
      {
        accessorKey: 'size',
        header: 'Размер',
        size: 150,
      },
      {
        accessorKey: 'actions',
        header: 'Действия',
        size: 300,
        Cell: ({ row }: { row: any }) => (
          <div className="flex gap-2">
            {['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(row.original.extension) ? (
              <img
                src={`${window.config.server}/download/?id=${row.original.id}`}
                alt={row.original.name}
                className="w-20 h-20"
              />
            ) : null}
            <Button
              onClick={() => {
                setSelectedFile(row.original);
                props.onChange({
                  id: row.original.id,
                });
                setOpenFileDialog(false);
              }}
            >
              Выбрать
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <FormControl>
        <RadioGroup
          value={formType}
          onChange={(e) => setFormType(e.target.value as any)}
        >
          <FormControlLabel
            value="id"
            control={<Radio />}
            label={(
              <>
                {selectedFile?.name}
                <Button
                  onClick={() => setOpenFileDialog(true)}
                  disabled={formType === 'file'}
                >
                  Выбрать из галереи
                </Button>
              </>
)}
          />
          <FormControlLabel
            value="file"
            control={<Radio />}
            label={(
              <input
                type="file"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    props.onChange({
                      file: await toBase64(e.target.files[0]),
                      name: e.target.files[0].name,
                    });
                  }
                }}
                disabled={formType === 'id'}
              />
)}
          />
        </RadioGroup>
      </FormControl>
      <Dialog open={openFileDialog} onClose={() => setOpenFileDialog(false)}>
        <DialogContent>
          <MaterialReactTable
            columns={columns}
            data={data.getFiles}
            enableColumnResizing
            enableFullScreenToggle={false}
            enableDensityToggle
            enableColumnFilters
            enablePagination
            enableSorting
            muiTableProps={{
              sx: {
                tableLayout: 'fixed',
              },
            }}
            renderTopToolbarCustomActions={() => (
              <div className="px-4 py-2">
                <h1 className="text-xl font-bold">Файлы</h1>
              </div>
            )}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function FormFieldUser(props: FormFieldProps) {
  const users = useQuery(gql`
    query {
      getUsers {
        id
        name
      }
    }
  `);
  if (!users.data) {
    return null;
  }

  return (
    <S3Autocomplete
      label={props.title}
      value={props.value || ''}
      options={users.data.getUsers.map((user: IUser) => ({
        id: user.id,
        name: user.name,
      }))}
      onChange={(value) => props.onChange(value)}
    />
  );
}

function FormFieldOneToManyOne(props: FormFieldProps) {
  const table = useTable(props.field.oneToManyLinkManyTable?.id || '');
  if (!table.data) {
    return null;
  }
  return (
    <TextField
      select
      label={props.title}
      value={props.value || ''}
      onChange={(e) => props.onChange(e.target.value)}
    >
      <MenuItem value={null as any}>Не выбрано</MenuItem>
      {table.data?.map((row: any) => (
        <MenuItem key={row.id} value={row.id}>
          {row._cms_title}
        </MenuItem>
      ))}
    </TextField>
  );
}

function FormFieldMultipleId(props: FormFieldProps) {
  let tableId = '';
  if (props.field.type === FieldType.MANY_TO_MANY_FIRST) {
    tableId = props.field.manyToManyLinkSecondTable?.id || '';
  }
  if (props.field.type === FieldType.MANY_TO_MANY_SECOND) {
    tableId = props.field.manyToManyLinkFirstTable?.id || '';
  }
  if (props.field.type === FieldType.ONE_TO_MANY_MANY) {
    tableId = props.field.oneToManyLinkOneTable?.id || '';
  }
  const table = useTable(tableId);
  if (!table.data) {
    return null;
  }
  return (
    <S3Autocomplete
      multiple
      label={props.title}
      value={props.value || []}
      options={table.data?.map((row: any) => ({
        id: row.id,
        name: row._cms_title,
      }))}
      onChange={(value) => props.onChange(value)}
    />
  );
}

interface FormFieldModalProps extends Omit<FormFieldProps, 'onChange'> {
  onChange?: (value: any) => void;
  onSave?: (value: any) => void;
  inline: boolean;
}

export function FormFieldHTML(props: FormFieldModalProps) {
  const [openEditorDialog, setOpenEditorDialog] = useState(false);
  const [localHtml, setLocalHtml] = useState(props.value || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleOpen = () => {
    setLocalHtml(props.value || '');
    setHasChanges(false);
    setConfirmCancel(false);
    setOpenEditorDialog(true);
  };

  const handleCancel = () => {
    if (confirmCancel) {
      setOpenEditorDialog(false);
      return;
    }
    if (!hasChanges) {
      setOpenEditorDialog(false);
      return;
    }
    setConfirmCancel(true);
  };

  const handleSave = () => {
    props?.onSave?.(localHtml);
    setOpenEditorDialog(false);
  };

  return props.inline ? (
    <div className="flex h-full">
      <div className="flex-1 pr-2.5">
        <Editor
          height="100%"
          defaultLanguage="html"
          value={localHtml}
          onChange={(value) => {
            const newValue = value || '';
            setLocalHtml(newValue);
            setHasChanges(true);
            props.onChange?.(newValue);
          }}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            overviewRulerLanes: 0,
          }}
        />
      </div>
      <div className="flex-1 p-2.5 overflow-auto border-l">
        <div dangerouslySetInnerHTML={{ __html: localHtml }} />
      </div>
    </div>
  ) : (
    <>
      <Button variant="text" onClick={handleOpen}>
        Открыть редактор
      </Button>
      <Dialog
        open={openEditorDialog}
        onClose={handleCancel}
        fullScreen
        sx={{ '& .MuiDialog-paper': { height: '100%', width: '100%', margin: 0 } }}
      >
        <DialogContent className="flex h-full">
          <div className="flex-1 pr-2.5">
            <Editor
              height="100%"
              defaultLanguage="html"
              value={localHtml}
              onChange={(value) => {
                setLocalHtml(value || '');
                setHasChanges(true);
              }}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                overviewRulerLanes: 0,
              }}
            />
          </div>
          <div className="flex-1 p-2.5 overflow-auto border-l">
            <div dangerouslySetInnerHTML={{ __html: localHtml }} />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color={confirmCancel ? 'error' : 'primary'}>
            {confirmCancel ? 'Есть несохраненные изменения, отменить?' : 'Отменить'}
          </Button>
          <Button onClick={handleSave} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function FormFieldBlock(props: FormFieldModalProps) {
  const [openEditorDialog, setOpenEditorDialog] = useState(false);
  const [localBlockContent, setLocalBlockContent] = useState(
    typeof props.value === 'string' && props.value ? JSON.parse(props.value) : props.value || [],
  );

  const [hasChanges, setHasChanges] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const handleOpen = () => {
    setLocalBlockContent(
      typeof props.value === 'string' && props.value ? JSON.parse(props.value) : props.value || [],
    );
    setHasChanges(false);
    setConfirmCancel(false);
    setOpenEditorDialog(true);
  };

  const handleCancel = () => {
    if (confirmCancel) {
      setOpenEditorDialog(false);
      return;
    }
    if (!hasChanges) {
      setOpenEditorDialog(false);
      return;
    }
    setConfirmCancel(true);
  };

  const handleSave = () => {
    props?.onSave?.(JSON.stringify(localBlockContent));
    setOpenEditorDialog(false);
  };

  return props.inline ? (
    <div className="flex size-full">
      <BlockEditor
        initialData={localBlockContent}
        onChange={(value) => {
          setLocalBlockContent(value);
          setHasChanges(true);
          props.onChange?.(value);
        }}
      />
    </div>
  ) : (
    <>
      <Button variant="text" onClick={handleOpen}>
        Открыть редактор
      </Button>
      <Dialog
        open={openEditorDialog}
        onClose={handleCancel}
        fullScreen
        sx={{ '& .MuiDialog-paper': { height: '100%', width: '100%', margin: 0 } }}
      >
        <DialogContent className="flex h-full">
          <div className="flex-1">
            <BlockEditor
              initialData={localBlockContent}
              onChange={(value) => {
                setLocalBlockContent(value);
                setHasChanges(true);
              }}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color={confirmCancel ? 'error' : 'primary'}>
            {confirmCancel ? 'Есть несохраненные изменения, отменить?' : 'Отменить'}
          </Button>
          <Button onClick={handleSave} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function FormField(props: FormFieldProps) {
  if (!props.field) {
    return null;
  }
  if (props.field.type === FieldType.ONE_TO_MANY_ONE) {
    return (
      <FormFieldOneToManyOne
        title={props.title}
        field={props.field}
        value={props.value}
        onChange={props.onChange}
      />
    );
  }
  if (props.field.type === FieldType.MANY_TO_MANY_FIRST
      || props.field.type === FieldType.MANY_TO_MANY_SECOND
      || props.field.type === FieldType.ONE_TO_MANY_MANY) {
    return (
      <FormFieldMultipleId
        title={props.title}
        field={props.field}
        value={props.value}
        onChange={props.onChange}
      />
    );
  }
  if (props.field.type === FieldType.STRING
      || props.field.type === FieldType.EMAIL
      || props.field.type === FieldType.PHONE
      || props.field.type === FieldType.URL
  ) {
    return (
      <TextField
        label={props.title}
        value={props.value || ''}
        onChange={(e) => props.onChange(e.target.value)}
        className="min-w-48"
      />
    );
  }
  if (props.field.type === FieldType.TEXT) {
    return (
      <TextField
        label={props.title}
        value={props.value || ''}
        onChange={(e) => props.onChange(e.target.value)}
        multiline
        rows={1}
        className="min-w-48"
      />
    );
  }
  if (props.field.type === FieldType.COLOR) {
    return (
      <MuiColorInput
        label={props.title}
        value={props.value || ''}
        onChange={(value) => props.onChange(value)}
      />
    );
  }
  if (props.field.type === FieldType.GEO) {
    return (
      <div>
        <div>{props.field.name}</div>
        <YMaps query={{ apikey: window.config.yandexKey }}>
          <Map
            defaultState={{
              center: [props.value?.lat || 55.751574, props.value?.lng || 37.573856],
              zoom: 9,
              controls: [],

            }}
            onClick={(e: any) => {
              const coords = e.get('coords');
              props.onChange({ lat: coords[0], lng: coords[1] });
            }}
          >
            <Placemark options={{ iconColor: 'red' }} geometry={[props.value?.lat || 0, props.value?.lng || 0]} />
            <SearchControl
              options={{ float: 'right', noPlacemark: true }}
              onResultSelect={(e: any) => {
                const data = e.originalEvent.target.state._data;
                const coords = data.results[data.currentIndex].geometry._coordinates;
                props.onChange({ lat: coords[0], lng: coords[1] });
                e.preventDefault();
              }}
            />
            <FullscreenControl />
          </Map>
        </YMaps>
      </div>
    );
  }
  if (props.field.type === FieldType.NUMBER) {
    return (
      <TextField
        label={props.title}
        value={props.value || 0}
        type="number"
        onChange={(e) => props.onChange(parseInt(e.target.value, 10))}
      />
    );
  }
  if (props.field.type === FieldType.DECIMAL
    || props.field.type === FieldType.CURRENCY) {
    return (
      <TextField
        label={props.title}
        value={props.value || 0}
        type="number"
        onChange={(e) => props.onChange(parseFloat(e.target.value))}
      />
    );
  }
  if (props.field.type === FieldType.DATE_TIME) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
        <DateTimePicker
          sx={{ width: '200px' }}
          label={props.title}
          value={props.value ? dayjs(props.value) : null}
          onChange={(value) => props.onChange(value)}
        />
      </LocalizationProvider>
    );
  }
  if (props.field.type === FieldType.DATE) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
        <DatePicker
          label={props.title}
          value={props.value ? dayjs(props.value) : null}
          onChange={(value) => props.onChange(value?.format('YYYY-MM-DD'))}
        />
      </LocalizationProvider>
    );
  }
  if (props.field.type === FieldType.TIME) {
    console.log(props.value);
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
        <TimePicker
          label={props.title}
          value={props.value ? dayjs(props.value, 'HH:mm:ss') : null}
          onChange={(value) => props.onChange(value?.format('HH:mm:ss'))}
        />
      </LocalizationProvider>
    );
  }
  if (props.field.type === FieldType.BOOLEAN) {
    return (
      <FormControl>
        <FormControlLabel
          label={props.title}
          control={(
            <Checkbox
              checked={props.value || false}
              onChange={(e) => props.onChange(e.target.checked)}
            />
          )}
        />
      </FormControl>
    );
  }
  if (props.field.type === FieldType.FILE) {
    return (
      <FormFieldFile
        title={props.title}
        field={props.field}
        value={props.value}
        onChange={props.onChange}
      />
    );
  }
  if (props.field.type === FieldType.USER) {
    return (
      <FormFieldUser
        title={props.title}
        field={props.field}
        value={props.value}
        onChange={props.onChange}
      />
    );
  }
  if (props.field.type === FieldType.HTML) {
    return (
      <FormFieldHTML
        title={props.title}
        field={props.field}
        value={props.value}
        onChange={(value) => props.onChange(value)}
        inline
      />
    );
  }
  if (props.field.type === FieldType.BLOCK) {
    return (
      <FormFieldBlock
        title={props.title}
        field={props.field}
        value={props.value}
        onChange={(value) => props.onChange(value)}
        inline
      />
    );
  }
  return null;
}
