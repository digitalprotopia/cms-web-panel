import {
  useMemo, use, useState, useCallback, useRef,
} from 'react';
import {
  MaterialReactTable,
  MRT_RowData,
  type MRT_ColumnDef,
} from 'material-react-table';
import {
  Button,
  IconButton,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  Popover,
  MenuItem,
  Select,
  InputLabel,
} from '@mui/material';
import {
  Add, ArrowDropDown, Close, Delete, Save,
} from '@mui/icons-material';
import { gql, useApolloClient } from '@apollo/client';

import TableEditor from '@/components/table-editor';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Link from 'next/link';
import { FieldType, IField } from '@/components/entities/IField';
import { FormField } from '@/components/form';
import useTable, {
  TableMeta,
  useAddField,
  useAddRow,
  useDeleteField,
  useEditField,
  useEditRow,
} from '../../../../components/use-table';

interface Field {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'text'
  dbName: string;
}

interface AddRowFormProps {
  meta: TableMeta;
  refetch: () => Promise<void>;
}

interface FormData {
  [key: string]: string | number | boolean | Date | null;
}

dayjs.extend(utc);
function AddRowForm({ meta, refetch }: AddRowFormProps) {
  const [form, setForm] = useState<FormData>({});
  const addRow = useAddRow(meta.dbName);

  const handleSubmit = async () => {
    try {
      const formattedInput = Object.fromEntries(
        Object.entries(form).map(([key, value]) => {
          const field = meta.fields.find((f) => f.dbName === key);

          switch (field?.type) {
            case 'number':
              return [key, value === '' ? null : Number(value)];
            case 'boolean':
              return [key, Boolean(value)];
            case 'date':
              return [key, value instanceof Date ? value.getTime() : null];
            default:
              return [key, value];
          }
        }),
      );

      await addRow({});

      await refetch();
      setForm({});
    } catch (error) {
      console.error('Error adding row:', error);
    }
  };

  const renderField = (field: Field) => {
    switch (field.type) {
      case 'boolean':
        return (
          <div key={field.id} className="w-full md:w-1/2 lg:w-1/3 p-2">
            <FormControl fullWidth className="mt-2">
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={Boolean(form[field.dbName])}
                    onChange={(e) => setForm((prev) => ({
                      ...prev,
                      [field.dbName]: e.target.checked,
                    }))}
                  />
                )}
                label={field.name}
                className="m-0"
              />
            </FormControl>
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="w-full md:w-1/2 lg:w-1/3 p-2">
            <DateTimePicker
              label={field.name}
              value={form[field.dbName] ? dayjs(form[field.dbName]) : null}
              onChange={(newValue) => setForm((prev) => ({
                ...prev,
                [field.dbName]: newValue ? newValue.toDate() : null,
              }))}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  className: 'mt-2',
                },
              }}
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="w-full md:w-1/2 lg:w-1/3 p-2">
            <TextField
              fullWidth
              label={field.name}
              type="number"
              variant="outlined"
              size="small"
              className="mt-2"
              value={form[field.dbName] || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? '' : Number(e.target.value);
                setForm((prev) => ({ ...prev, [field.dbName]: value }));
              }}
            />
          </div>
        );

      default: // string
        return (
          <div key={field.id} className="w-full md:w-1/2 lg:w-1/3 p-2">
            <TextField
              fullWidth
              label={field.name}
              variant="outlined"
              size="small"
              className="mt-2"
              value={form[field.dbName] || ''}
              onChange={(e) => setForm((prev) => ({ ...prev, [field.dbName]: e.target.value }))}
            />
          </div>
        );
    }
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      {/* <div className="flex flex-wrap -mx-2">
        {meta.fields.map((field) => renderField(field))}
      </div> */}

      <Button
        variant="contained"
        onClick={handleSubmit}
        // disabled={Object.keys(form).length === 0}
        className="mt-4 normal-case"
      >
        Добавить строку
      </Button>
    </div>
  );
}

interface TablePageProps {
  params: Promise<{ id: string }>;
}

function TablePage({ params }: TablePageProps) {
  const { id } = use(params);
  const client = useApolloClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tableMetadata, setTableMetadata] = useState<TableMeta | null>(null);

  const {
    data, meta, loading, error, refetch,
  } = useTable(id, {
    onMetaLoaded: (meta) => {
      setTableMetadata(meta);
    },
    onDataLoaded: (data) => {
      // console.log('Table data loaded:', data);
    },
  });

  const handleRefetch = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error refetching data:', error);
    }
  }, [refetch]);

  const columns = useMemo(() => {
    if (!meta?.fields) return [];

    const result = meta.fields.map(
      (field): MRT_ColumnDef<MRT_RowData> => ({
        accessorKey: field.dbName,
        header: field.name,
        Header: ({ header }) => {
          const dropDownRef = useRef();
          const [dropDownOpen, setDropDownOpen] = useState(false);
          const deleteField = useDeleteField();
          const editField = useEditField();
          const [editForm, setEditForm] = useState<Partial<IField>>({
            name: field.name,
          });
          return (
            <div
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              {field.name}
              <IconButton
                ref={dropDownRef}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setDropDownOpen(true);
                }}
              >
                <ArrowDropDown />
              </IconButton>
              <Popover
                anchorEl={dropDownRef.current}
                open={dropDownOpen}
                onClose={() => setDropDownOpen(false)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
              >
                <div className="p-4">
                  <h4>Редактировать поле</h4>
                  <TextField
                    label="Название"
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <Button
                    variant="contained"
                    onClick={async () => {
                      await editField(field.id, {
                        name: editForm.name,
                      });
                      setDropDownOpen(false);
                      setTimeout(() => handleRefetch(), 2000);
                    }}
                  >
                    Редактировать
                  </Button>
                  <h4>Удалить поле</h4>
                  <Button
                    variant="contained"
                    onClick={async () => {
                      await deleteField(field.id);
                      setDropDownOpen(false);
                      setTimeout(() => handleRefetch(), 2000);
                    }}
                    color="error"
                  >
                    Удалить
                  </Button>
                </div>
              </Popover>
            </div>
          );
        },
        Cell: ({ cell, row }) => {
          const [editMode, setEditMode] = useState(false);
          const [value, setValue] = useState<any>(cell.getValue());
          const editRow = useEditRow(meta.dbName);
          if (field.type === 'boolean') {
            return (
              <Checkbox
                checked={!!cell.getValue()}
                onChange={(e) => {
                  editRow(row.original.id, {
                    [field.dbName]: e.target.checked,
                  });
                  refetch();
                }}
              />
            );
          }
          if (editMode) {
            return (
              <div>
                <FormField
                  field={field}
                  value={value}
                  title=""
                  type={field.type}
                  onChange={(value) => setValue(value)}
                />
                <IconButton
                  onClick={async () => {
                    console.log(value);
                    await editRow(row.original.id, {
                      [field.dbName]: value,
                    });
                    setEditMode(false);
                    refetch();
                  }}
                >
                  <Save />
                </IconButton>
                <IconButton
                  onClick={() => {
                    setValue(cell.getValue());
                    setEditMode(false);
                  }}
                >
                  <Close />
                </IconButton>
              </div>
            );
          }
          let cellValue = cell.getValue();
          if (field.type === FieldType.DATE) {
            cellValue = dayjs(value).format('YYYY-MM-DD HH:mm');
          }
          if (field.type === FieldType.TEXT) {
            cellValue = <div style={{ whiteSpace: 'pre' }}>{cellValue || <i>Нет текста</i>}</div>;
          }
          if (field.type === FieldType.GEO) {
            cellValue = `${cellValue?.lat}, ${cellValue?.lng}`;
          }
          return (
            <div onClick={() => setEditMode(true)}>
              {cellValue || <i>Нет текста</i>}
            </div>
          );
        },
      }),
    );
    result.push({
      header: '+',
      Header: () => {
        const dropDownRef = useRef();
        const [dropDownOpen, setDropDownOpen] = useState(false);
        const [form, setForm] = useState<Partial<IField>>({
          name: '',
          dbName: '',
          type: FieldType.STRING,
        });
        const addField = useAddField(meta.id);

        return (
          <div>
            <IconButton
              ref={dropDownRef}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setDropDownOpen(true);
              }}
            >
              <Add />
            </IconButton>
            <Popover
              anchorEl={dropDownRef.current}
              open={dropDownOpen}
              onClose={() => setDropDownOpen(false)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              PaperProps={{
                className: 'w-80',
              }}
            >
              <div className="p-6 flex flex-col space-y-4">
                <h4 className="text-lg font-medium text-gray-900">
                  Добавить поле
                </h4>

                <TextField
                  fullWidth
                  size="small"
                  label="Название"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Имя в базе данных"
                  value={form.dbName}
                  onChange={(e) => setForm((prev) => ({ ...prev, dbName: e.target.value }))}
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Тип поля</InputLabel>
                  <Select
                    value={form.type}
                    label="Тип поля"
                    onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    <MenuItem value="" disabled>
                      <em>Выберите тип поля</em>
                    </MenuItem>
                    {Object.values(FieldType).map((key) => (
                      <MenuItem key={key} value={key}>
                        {key}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={async () => {
                    await addField({
                      name: form.name,
                      dbName: form.dbName,
                      type: form.type,
                    });
                    setDropDownOpen(false);
                    setTimeout(() => handleRefetch(), 2000);
                  }}
                  disabled={!form.name || !form.dbName || !form.type}
                  className="mt-2"
                >
                  Добавить
                </Button>
              </div>
            </Popover>
          </div>
        );
      },
      enableColumnActions: false,
    });
    return result;
  }, [meta?.fields]);

  const handleDeleteRow = async (row: any) => {
    try {
      await client.mutate({
        mutation: gql`
            mutation {
                delete${meta.dbName}(id: "${row.original.id}")
            }
        `,
      });
      await handleRefetch();
    } catch (error) {
      console.error('Error deleting row:', error);
    }
  };

  const handleModalClose = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  const handleModalSuccess = useCallback(async () => {
    await handleRefetch();
    handleModalClose();
  }, [handleRefetch, handleModalClose]);

  if (loading) return <div>Loading...</div>;
  if (error) {
    return (
      <div>
        Error:
        {error.message}
      </div>
    );
  }
  if (!meta || !data) return null;

  return (
    <div className="rounded-lg p-4 shadow-lg bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">{meta?.name}</h2>
        <div className="flex gap-4">
          <Button
            variant="contained"
            onClick={() => setIsEditModalOpen(true)}
            className="normal-case"
          >
            Редактировать таблицу
          </Button>
          {/* <Link href={`/admin/widgets/add?table-id=${id}`}> */}
          {/*  <Button variant="contained" className="normal-case"> */}
          {/*    Добавить виджет */}
          {/*  </Button> */}
          {/* </Link> */}
          {/* <Link href={`/admin/forms/add?table-id=${id}`}> */}
          {/*  <Button variant="contained" className="normal-case"> */}
          {/*    Добавить форму */}
          {/*  </Button> */}
          {/* </Link> */}
        </div>
      </div>

      <TableEditor
        open={isEditModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        mode="edit"
        initialData={tableMetadata}
        tableId={id}
      />

      <MaterialReactTable
        columns={columns}
        data={data}
        enableRowActions
        renderRowActions={({ row }) => (
          <IconButton
            color="error"
            onClick={() => handleDeleteRow(row)}
            className="hover:bg-red-50"
          >
            <Delete />
          </IconButton>
        )}
        state={{ isLoading: loading }}
        muiTablePaperProps={{
          elevation: 0,
          sx: {
            borderRadius: '0',
            border: '1px solid #e0e0e0',
          },
        }}
      />

      <AddRowForm meta={meta} refetch={handleRefetch} />
    </div>
  );
}

export default TablePage;
