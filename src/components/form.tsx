import {
  Checkbox,
  FormControl,
  FormControlLabel,
  MenuItem,
  TextField,
} from '@mui/material';
import dayjs from 'dayjs';
import { gql, useQuery } from '@apollo/client';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  DatePicker, DateTimePicker, LocalizationProvider, TimePicker,
} from '@mui/x-date-pickers';
import { FieldType } from './entities/IField';
import useTable, { TableField } from './use-table';
import S3Autocomplete from './guiElements/S3Autocomplete';
import { IUser } from './entities/IUser';
import 'dayjs/locale/ru';

interface FormFieldProps {
  title: string;
  // eslint-disable-next-line react/no-unused-prop-types
  field: TableField;
  value: any;
  onChange: (value: any) => void;
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
      {table.data?.map((row: any) => (
        <MenuItem key={row.id} value={row.id}>
          {row._cms_title}
        </MenuItem>
      ))}
    </TextField>
  );
}

const toBase64 = (file: File) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result?.toString().replace(/^data:(.*,)?/, ''));
  reader.onerror = reject;
});

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
      || props.field.type === FieldType.URL) {
    return (
      <TextField
        label={props.title}
        value={props.value || ''}
        onChange={(e) => props.onChange(e.target.value)}
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
      />
    );
  }
  if (props.field.type === FieldType.GEO) {
    return (
      <>
        <TextField
          label={`${props.title} lat`}
          value={props.value?.lat || 0}
          type="number"
          onChange={(e) => props.onChange({ ...props.value, lat: parseFloat(e.target.value) })}
        />
        <TextField
          label={`${props.title} lng`}
          value={props.value?.lng || 0}
          type="number"
          onChange={(e) => props.onChange({ ...props.value, lng: parseFloat(e.target.value) })}
        />
      </>
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
  return null;
}
