import {
  TextField,
} from '@mui/material';

export default function textField(
  field_label: string,
  value: string | undefined,
  setValueFuction: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>,
) {
  return (
    <TextField
      label={field_label}
      fullWidth
      value={value}
      onChange={setValueFuction}
      required
      slotProps={{
        htmlInput: { maxLength: 255 },
      }}
    />
  );
}
