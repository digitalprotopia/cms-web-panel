import { Autocomplete, Box, TextField } from '@mui/material';

type Option = {
  id: string;
  name: string;
  [key: string]: any;
};

interface S3AutocompleteProps {
  label?: string;
  value: string | string[] | undefined | null;
  multiple?: boolean ;
  options: Option[] | undefined;
  onChange: (value: string | string[] | null) => void;
  variant?: 'standard' | 'outlined';
  getOptionLabelFromKey?: string;
  renderOption?: (option: Option) => React.ReactNode;
}

function S3Autocomplete({
  label, value, multiple, options, onChange, variant, getOptionLabelFromKey, renderOption,
}: S3AutocompleteProps) {
  return (
    <Autocomplete
      fullWidth
      multiple={multiple}
      options={options?.map((option) => option.id) || []}
      getOptionLabel={(_value) => options?.find(
        (option) => option.id === _value,
      )?.[getOptionLabelFromKey as keyof Option || 'name'] || _value}
      value={value ?? (multiple ? [] : '')}
      onChange={(e, _value) => {
        onChange(_value);
      }}
      renderOption={renderOption ? (props, option) => {
        const { key, ...optionProps } = props;
        return (
          <Box
            key={key}
            component="li"
            {...optionProps}
          >
            {renderOption(options!.find((o) => o.id === option)!)}
          </Box>
        );
      } : undefined}
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
