import { Autocomplete, TextField } from '@mui/material';

type Option = {
  id: string;
  name: string;
};

interface S3AutocompleteProps {
  value: string | undefined | null;
  multiple?: boolean ;
  options: Option[] | undefined;
  onChange: (value: string | string[] | null) => void;
}

function S3Autocomplete({
  value, multiple, options, onChange,
}: S3AutocompleteProps) {
  return (
    <Autocomplete
      fullWidth
      multiple={multiple}
      options={options?.map((option) => option.id) || []}
      getOptionLabel={(_value) => options?.find((option) => option.id === _value)?.name || _value}
      value={value ?? ''}
      onChange={(e, _value) => {
        onChange(_value);
      }}
      filterSelectedOptions={multiple}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="standard"
          color="secondary"
        />
      )}
    />
  );
}

S3Autocomplete.defaultProps = {
  multiple: false,
};

export default S3Autocomplete;
