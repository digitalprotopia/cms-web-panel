import { Checkbox, FormControl, FormControlLabel, TextField } from '@mui/material';
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
  if (props.type === FieldType.NUMBER) {
    return (
      <TextField
        label={props.title}
        value={props.value || 0}
        type="number"
        onChange={(e) => props.onChange(e.target.value)}
      />
    );
  }
  if (props.type === FieldType.DATE) {
    return (
      <TextField
        label={props.title}
        value={props.value || new Date()}
        type="date"
        onChange={(e) => props.onChange(e.target.value)}
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
