import { Autocomplete, TextField } from '@mui/material';

type Option = {
  id: string;
  name: string;
};

interface S3AutocompleteProps {
  label?: string;
  value: string | undefined | null;
  multiple?: boolean ;
  options: Option[] | undefined;
  onChange: (value: string | string[] | null) => void;
  variant?: 'standard' | 'outlined';
  getOptionLabelFromKey?: string;
}

function S3Autocomplete({
  label, value, multiple, options, onChange, variant, getOptionLabelFromKey,
}: S3AutocompleteProps) {
  return (
    <Autocomplete
      fullWidth
      multiple={multiple}
      options={options?.map((option) => option.id) || []}
      getOptionLabel={(_value) => options?.find(
        (option) => option.id === _value,
      )?.[getOptionLabelFromKey as keyof Option] || _value}
      value={value ?? ''}
      onChange={(e, _value) => {
        onChange(_value);
      }}
      filterSelectedOptions={multiple}
      renderInput={(params) => (
        <TextField
          {...params}
          variant={variant}
          color="secondary"
          label={label}
        />
      )}
    />
  );
}

S3Autocomplete.defaultProps = {
  label: null,
  multiple: false,
  variant: 'standard',
  getOptionLabelFromKey: 'name',
};

export default S3Autocomplete;
