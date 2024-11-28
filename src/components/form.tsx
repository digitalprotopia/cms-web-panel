import {
  Checkbox,
  FormControl,
  FormControlLabel,
  MenuItem,
  TextField,
} from '@mui/material';
import dayjs from 'dayjs';
import { FieldType } from './entities/IField';
import useTable, { TableField } from './use-table';

interface FormFieldProps {
  title: string;
  field: TableField;
  value: any;
  onChange: (value: any) => void;
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
  if (props.field.type === FieldType.STRING) {
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
  if (props.field.type === FieldType.DATE) {
    return (
      <TextField
        label={props.title}
        value={dayjs(props.value || new Date()).format('YYYY-MM-DDTHH:mm')}
        type="datetime-local"
        onChange={(e) => props.onChange(new Date(e.target.value))}
      />
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
  return null;
}
