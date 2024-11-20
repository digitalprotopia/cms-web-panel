import {
  Checkbox,
  FormControl,
  FormControlLabel,
  TextField,
} from '@mui/material';
import dayjs from 'dayjs';
import { FieldType } from './entities/IField';

export function FormField(props: {
  title: string;
  type: FieldType;
  value: any;
  onChange: (value: any) => void;
}) {
  if (props.type === FieldType.STRING) {
    return (
      <TextField
        label={props.title}
        value={props.value || ''}
        onChange={(e) => props.onChange(e.target.value)}
      />
    );
  }
  if (props.type === FieldType.TEXT) {
    return (
      <TextField
        label={props.title}
        value={props.value || ''}
        onChange={(e) => props.onChange(e.target.value)}
        multiline
      />
    );
  }
  if (props.type === FieldType.GEO) {
    return (
      <>
        <TextField
          label={`${props.title} lat`}
          value={props.value.lat || 0}
          type="number"
          onChange={(e) => props.onChange({ ...props.value, lat: parseFloat(e.target.value) })}
        />
        <TextField
          label={`${props.title} lng`}
          value={props.value.lng || 0}
          type="number"
          onChange={(e) => props.onChange({ ...props.value, lng: parseFloat(e.target.value) })}
        />
      </>
    );
  }
  if (props.type === FieldType.NUMBER) {
    return (
      <TextField
        label={props.title}
        value={props.value || 0}
        type="number"
        onChange={(e) => props.onChange(parseInt(e.target.value))}
      />
    );
  }
  if (props.type === FieldType.DATE) {
    return (
      <TextField
        label={props.title}
        value={dayjs(props.value || new Date()).format('YYYY-MM-DD\THH:mm')}
        type="datetime-local"
        onChange={(e) => props.onChange(new Date(e.target.value))}
      />
    );
  }
  if (props.type === FieldType.BOOLEAN) {
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
