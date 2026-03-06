import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { mkConfig, generateCsv, download } from 'export-to-csv';
import {
  MaterialReactTable,
  MRT_Cell,
  MRT_Row,
  MRT_RowData,
  type MRT_ColumnDef,
} from 'material-react-table';
import { useRouter } from 'next/router';
import { useSnackbar } from 'notistack';
import {
  useMemo, useState, useCallback, useRef, useEffect,
} from 'react';
import {
  gql, useApolloClient, useMutation, useQuery,
} from '@apollo/client';
import {
  Add,
  ArrowDropDown,
  Close,
  Delete,
  Download,
  Edit,
  MapOutlined,
  OpenInFull,
  Save,
} from '@mui/icons-material';
import {
  Button,
  IconButton,
  TextField,
  FormControl,
  Checkbox,
  Popover,
  MenuItem,
  Select,
  InputLabel, DialogTitle, DialogContent, Dialog, DialogActions,
} from '@mui/material';

import {
  FieldType, IField, IFieldManyToManyOptions, IFieldOneToManyOptions,
  IFieldOptions,
  IFieldSlugOptions,
} from '@/components/entities/IField';
import FormField, { FormFieldBlock, FormFieldHTML } from '@/components/form';
import TableEditor from '@/components/table-editor';

import FieldPrivilegesDialog from '@/components/dialogs/FieldPrivilegeDialog';
import { useTranslation } from 'react-i18next';
import useTable, {
  TableField,
  TableMeta,
  useAddField,
  useAddRow,
  useDeleteField,
  useEditField,
  useEditRow,
} from '@/components/use-table-new';
import { IFile } from '@/components/entities/IFile';
import LoadingCircle from '@/components/loading-circle';

dayjs.extend(utc);

interface CellEditProps {
  cell: MRT_Cell<MRT_RowData>,
  row: MRT_Row<MRT_RowData>,
  field: TableField,
  meta: TableMeta,
  updateRow: (rowId: string, updatedRow: any) => void,
  setEditMode: (value: boolean) => void,
}

function CellEdit({
  cell, row, field, meta, updateRow, setEditMode,
}: CellEditProps) {
  const [value, setValue] = useState<any>(() => {
    if (field.type === FieldType.MANY_TO_MANY_FIRST
      || field.type === FieldType.MANY_TO_MANY_SECOND
      || field.type === FieldType.ONE_TO_MANY_MANY) {
      return (cell.getValue() as any)?.map((item: any) => item?.id);
    }
    if (field.type === FieldType.ONE_TO_MANY_ONE) {
      return (cell.getValue() as any)?.id;
    }
    if (field.type === FieldType.USER) {
      return (cell.getValue() as any)?.id;
    }
    return cell.getValue();
  });

  const [isDialogOpen, setDialogOpen] = useState(false);
  const editRow = useEditRow(meta.isSystem ? `SystemTable${meta.dbName}` : meta.dbName, [field]);

  if (field.type === FieldType.USER_CREATOR) {
    return null;
  }

  const handleSave = async (saveValue?: any) => {
    const updatedValue = saveValue !== undefined ? saveValue : value;

    if (saveValue !== undefined) {
      setValue(updatedValue);
    }

    const updatedRow = await editRow(row.original.id, {
      [field.dbName]: updatedValue,
    });

    if (updatedRow) {
      updateRow(row.original.id, updatedRow);
    }
    setEditMode(false);
    setDialogOpen(false);
  };

  if (field.type === FieldType.HTML) return (<FormFieldHTML title="" field={field} value={value} onSave={handleSave} inline={false} />);
  if (field.type === FieldType.BLOCK) return (<FormFieldBlock title="" field={field} value={value} onSave={handleSave} inline={false} />);

  return (
    <div className="flex items-center gap-1">
      {field.type === 'boolean' ? (
        <Checkbox
          checked={!!cell.getValue()}
          onChange={async (e) => {
            if (field.isSystem) {
              return;
            }
            const updatedRow = await editRow(row.original.id, {
              [field.dbName]: e.target.checked,
            });
            if (updatedRow) {
              updateRow(row.original.id, updatedRow);
            }
          }}
        />
      ) : (
        <>
          <FormField
            value={value}
            title=""
            field={field}
            onChange={(newValue) => setValue(newValue)}
          />

          <IconButton
            onClick={async () => {
              const updatedRow = await editRow(row.original.id, {
                [field.dbName]: value,
              });
              setEditMode(false);
              if (updatedRow) {
                updateRow(row.original.id, updatedRow);
              }
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
          {field.type === FieldType.TEXT && (
            <>
              <IconButton
                onClick={() => setDialogOpen(true)}
              >
                <OpenInFull />
              </IconButton>
              <Dialog open={isDialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xl">
                <DialogTitle>Редактирование текста</DialogTitle>
                <DialogContent>
                  <TextField
                    className="mt-0.5"
                    fullWidth
                    multiline
                    rows={10}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleSave}>
                    Сохранить
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )}
        </>
      )}

    </div>
  );
}

interface AddFieldProps {
  onClose: () => void;
  refetch: () => void;
  meta: TableMeta;
}

function AddField({ onClose, refetch, meta }: AddFieldProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<Partial<IField>>({
    name: '',
    dbName: '',
    type: FieldType.STRING,
  });
  const [oneToManyOptions, setOneToManyOptions] = useState<IFieldOneToManyOptions>({
    manyFieldTitle: '',
    manyTableId: '',
  });
  const [manyToManyOptions, setManyToManyOptions] = useState<IFieldManyToManyOptions>({
    secondFieldTitle: '',
    secondTableId: '',
  });

  const [slugFieldOptions, setSlugFieldOptions] = useState<IFieldSlugOptions>({
    sourceFieldId: '',
  });
  let options: (IFieldOptions | undefined);
  if (form.type === FieldType.ONE_TO_MANY_ONE) {
    options = oneToManyOptions!;
  }
  if (form.type === FieldType.MANY_TO_MANY_FIRST) {
    options = manyToManyOptions!;
  }
  if (form.type === FieldType.SLUG) {
    options = slugFieldOptions!;
  }
  const addField = useAddField(meta.id, form.type!);
  const { enqueueSnackbar } = useSnackbar();
  const tables = useQuery(gql`
    query {
      getTables {
        id
        name
      }
    }
  `);

  if (!tables.data) {
    return null;
  }

  return (
    <div className="p-6 flex flex-col space-y-4">
      <h4 className="text-lg font-medium text-gray-900">
        Добавить поле
      </h4>

      <TextField
        fullWidth
        size="small"
        label="Название"
        value={form.name}
        onChange={(e) => {
          setForm((prev) => ({ ...prev, name: e.target.value }));
          setOneToManyOptions((prev) => ({ ...prev, manyFieldTitle: e.target.value }));
          setManyToManyOptions((prev) => ({ ...prev, secondFieldTitle: e.target.value }));
        }}
      />

      <TextField
        fullWidth
        size="small"
        label="Имя в базе данных"
        value={form.dbName}
        onChange={(e) => {
          e.target.value = e.target.value.replace(/[^a-zA-Z0-9_]|^[A-Z0-9_]?/g, '');
          setForm((prev) => ({ ...prev, dbName: e.target.value }));
        }}
      />

      {form.type === FieldType.MANY_TO_MANY_FIRST
        && (
          <TextField
            fullWidth
            size="small"
            label="Таблица"
            select
            value={manyToManyOptions.secondTableId}
            onChange={(e) => setManyToManyOptions(
              (prev) => ({ ...prev, secondTableId: e.target.value }),
            )}
          >
            {tables.data.getTables.map((table: any) => (
              <MenuItem key={table.id} value={table.id}>
                {table.name}
              </MenuItem>
            ))}
          </TextField>
        )}

      <FormControl fullWidth size="small">
        <InputLabel>Тип поля</InputLabel>
        <Select
          value={form.type}
          label="Тип поля"
          onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value } as any))}
        >
          <MenuItem value="" disabled>
            <em>Выберите тип поля</em>
          </MenuItem>
          {Object.values(FieldType)
            .filter((key) => ![
              FieldType.ONE_TO_MANY_MANY,
              FieldType.MANY_TO_MANY_SECOND,
            ].includes(key))
            .map((key) => (
              <MenuItem key={key} value={key}>
                {t(key)}
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      {form.type === FieldType.SLUG
        && (
          <TextField
            fullWidth
            size="small"
            label="Строковое поле"
            select
            value={slugFieldOptions.sourceFieldId}
            onChange={(e) => setSlugFieldOptions(
              (prev) => ({ ...prev, sourceFieldId: e.target.value }),
            )}
          >
            {meta.fields.filter((field) => field.type === FieldType.STRING).map((field) => (
              <MenuItem key={field.id} value={field.id}>
                {field.name}
              </MenuItem>
            ))}
          </TextField>
        )}

      {form.type === FieldType.ONE_TO_MANY_ONE
        && (
          <TextField
            fullWidth
            size="small"
            label="Таблица"
            select
            value={oneToManyOptions.manyTableId}
            onChange={(e) => {
              setOneToManyOptions((prev) => ({ ...prev, manyTableId: e.target.value }));
            }}
          >
            {tables.data.getTables.map((table: any) => (
              <MenuItem key={table.id} value={table.id}>
                {table.name}
              </MenuItem>
            ))}
          </TextField>
        )}

      {form.type === FieldType.MANY_TO_MANY_FIRST
        && (
          <TextField
            fullWidth
            size="small"
            label="Таблица"
            select
            value={manyToManyOptions.secondTableId}
            onChange={(e) => setManyToManyOptions(
              (prev) => ({ ...prev, secondTableId: e.target.value }),
            )}
          >
            {tables.data.getTables.map((table: any) => (
              <MenuItem key={table.id} value={table.id}>
                {table.name}
              </MenuItem>
            ))}
          </TextField>
        )}

      <Button
        fullWidth
        variant="contained"
        onClick={async () => {
          await addField(
            {
              name: form.name,
              dbName: form.dbName,
              type: form.type,
            },
            options,
          );
          onClose();
          setTimeout(() => refetch(), 2000);
          enqueueSnackbar(`Поле ${form.name} добавлено`, { variant: 'success', autoHideDuration: 3000 });
        }}
        disabled={!form.name || !form.dbName || !form.type}
        className="mt-2"
      >
        Добавить
      </Button>
    </div>
  );
}

interface RowDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData: any;
  meta: TableMeta;
  onSave: (form: any) => Promise<void>;
}

const isFieldEditable = (field: TableField) => {
  if (field.isSystem) return false;
  switch (field.type) {
    case FieldType.USER_CREATOR:
    case FieldType.USER:
      return false;
    default:
      return true;
  }
};

const getFieldValue = (field: TableField, mode: 'create' | 'edit', initialData: any) => {
  if (mode === 'create') {
    switch (field.type) {
      case FieldType.MANY_TO_MANY_FIRST:
      case FieldType.MANY_TO_MANY_SECOND:
      case FieldType.ONE_TO_MANY_MANY:
      case FieldType.FILE_GALLERY:
        return [];
      default:
        return null;
    }
  }

  const value = initialData?.[field.dbName];

  switch (field.type) {
    case FieldType.MANY_TO_MANY_FIRST:
    case FieldType.MANY_TO_MANY_SECOND:
    case FieldType.ONE_TO_MANY_MANY:
      return Array.isArray(value) ? value.map((item: any) => item?.id) : [];

    case FieldType.ONE_TO_MANY_ONE:
    case FieldType.USER:
    case FieldType.USER_CREATOR:
      return value?.id ?? null;

    default:
      return value;
  }
};

const getNormalizedInput = (form: any, initialData: any, fields: TableField[]) => {
  const result: any = {};

  fields.forEach((field) => {
    if (!isFieldEditable(field)) return;

    const currentValue = form[field.dbName];

    if (initialData) {
      const initialValue = getFieldValue(field, 'edit', initialData);

      if (JSON.stringify(currentValue) === JSON.stringify(initialValue)) {
        return;
      }
    } else {
      if (currentValue === null || currentValue === undefined || currentValue === '') return;
      if (Array.isArray(currentValue) && currentValue.length === 0) return;
    }

    result[field.dbName] = currentValue;
  });

  return result;
};

function RowDialog({
  open, onClose, mode, initialData, meta, onSave,
}: RowDialogProps) {
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!open) return;

    const editableFields = meta.fields.filter(isFieldEditable);

    const initialForm = editableFields.reduce((acc: any, field: TableField) => {
      acc[field.dbName] = getFieldValue(field, mode, initialData);
      return acc;
    }, {});

    setForm(initialForm);
  }, [open, mode, initialData, meta]);

  const fields = [...meta.fields];
  fields.sort((a, b) => a.position - b.position);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {mode === 'create' ? 'Добавить строку' : 'Редактировать строку'}
      </DialogTitle>

      <DialogContent>
        <div className="flex flex-col gap-4 mt-2">
          {fields.filter(isFieldEditable).map((field: TableField) => (
            <FormField
              key={field.id}
              field={field}
              title={field.name}
              value={form[field.dbName]}
              onChange={(value) => setForm({ ...form, [field.dbName]: value })}
            />
          ))}
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          onClick={async () => {
            await onSave(form);
            onClose();
          }}
          variant="contained"
          color="primary"
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TablePage() {
  const router = useRouter();
  const { id } = router.query;
  const client = useApolloClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tableMetadata, setTableMetadata] = useState<TableMeta | null>(null);

  const {
    data, meta, loading, error, refetch, updateRow, addRowToData, removeRow,
  } = useTable(id as string, {
    onMetaLoaded: (_meta) => {
      setTableMetadata(_meta);
    },
  });

  const [rowDialogOpen, setRowDialogOpen] = useState(false);
  const [rowDialogMode, setRowDialogMode] = useState<'create' | 'edit'>('create');
  const [currentRow, setCurrentRow] = useState<any>(null);

  const addRow = useAddRow(meta?.dbName || '', meta?.fields);
  const editRow = useEditRow(meta?.isSystem ? `SystemTable${meta.dbName}` : (meta?.dbName || ''), meta?.fields);

  const handleOpenAddDialog = () => {
    setRowDialogMode('create');
    setCurrentRow(null);
    setRowDialogOpen(true);
  };

  const handleOpenEditDialog = (row: any) => {
    setRowDialogMode('edit');
    setCurrentRow(row);
    setRowDialogOpen(true);
  };

  const [sortFields] = useMutation(gql`
    mutation($tableId: ID! $positions: [PositionItem]!) {
      sortFields(tableId: $tableId positions: $positions)
    }
  `);

  const handleRefetch = useCallback(async () => {
    try {
      await refetch();
    } catch (e) {
      console.error('Error refetching data:', e);
    }
  }, [refetch]);

  const fields = meta?.fields ? [...meta.fields] : [];
  fields.sort((a, b) => a.position - b.position);
  const [isFieldPrivilegesDialogOpen, setIsFieldPrivilegesDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<IField | null>(null);

  const columns = useMemo(() => {
    let result: MRT_ColumnDef<MRT_RowData>[] = [
      {
        accessorKey: 'id',
        header: 'ID',
        Header: 'ID',
        Cell: ({ cell }) => <>{cell.getValue()}</>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Создан',
        Header: 'Создан',
        Cell: ({ cell }) => (
          cell.getValue()
            ? dayjs(cell.getValue() as any).format('YYYY-MM-DD HH:mm') : null
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Обновлен',
        Header: 'Обновлен',
        Cell: ({ cell }) => (
          cell.getValue()
            ? dayjs(cell.getValue() as any).format('YYYY-MM-DD HH:mm') : null
        ),
      },
      {
        accessorKey: 'createdBy',
        header: 'Создал',
        Header: 'Создал',
        Cell: ({ cell }) => (cell.getValue() as any)?.name,
      },
      {
        accessorKey: 'updatedBy',
        header: 'Обновил',
        Header: 'Обновил',
        Cell: ({ cell }) => (cell.getValue() as any)?.name,
      },
    ];

    result = [...result, ...fields.map(
      (field: IField): MRT_ColumnDef<MRT_RowData> => ({
        accessorKey: field.dbName,
        header: field.name,
        Header: () => {
          const dropDownRef = useRef();
          const [dropDownOpen, setDropDownOpen] = useState(false);
          const deleteField = useDeleteField();
          const editField = useEditField();
          const [editForm, setEditForm] = useState<Partial<IField>>({
            name: field.name,
            dbName: field.dbName,
          });
          const { t } = useTranslation();
          return (
            <div
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              {field.name}
              {!field.isSystem && (
                <IconButton
                  ref={dropDownRef as any}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setDropDownOpen(true);
                  }}
                >
                  <ArrowDropDown />
                </IconButton>
              )}
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
                  <div className="text-sm">
                    Служебное название:
                    {' '}
                    {field.dbName}
                  </div>
                  <div className="text-sm">
                    Тип:
                    {' '}
                    {t(field.type)}
                  </div>
                  <h4>Редактировать поле</h4>
                  <TextField
                    label="Название"
                    value={editForm.name}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <TextField
                    label="Техническое название"
                    value={editForm.dbName}
                    onChange={(e) => {
                      e.target.value = e.target.value.replace(/[^a-zA-Z0-9_]|^[A-Z0-9_]?/g, '');
                      setEditForm((prev) => ({ ...prev, dbName: e.target.value }));
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={async () => {
                      await editField(field.id, {
                        name: editForm.name,
                        dbName: editForm.dbName,
                      });
                      setDropDownOpen(false);
                      setTimeout(() => handleRefetch(), 2000);
                    }}
                  >
                    Редактировать
                  </Button>
                  <div>
                    <Button
                      variant="contained"
                      onClick={() => {
                        setSelectedField(field);
                        setDropDownOpen(false);
                        setIsFieldPrivilegesDialogOpen(true);
                      }}
                      style={{ marginTop: '8px', display: 'none' }}
                    >
                      Редактировать права поля
                    </Button>
                  </div>
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
          const [editMode, setEditMode] = useState(!field.isSystem
            && [FieldType.HTML, FieldType.BLOCK]
              .includes(field.type));
          if (!field.isSystem && (editMode || field.type === FieldType.BOOLEAN)) {
            return (
              <CellEdit
                cell={cell}
                row={row}
                field={field}
                meta={meta}
                updateRow={updateRow}
                setEditMode={setEditMode}
              />
            );
          }
          let cellValue: any = cell.getValue();
          if (field.type === FieldType.DATE_TIME) {
            if (cellValue) {
              cellValue = dayjs(cellValue).format('YYYY-MM-DD HH:mm');
            }
          }
          if (field.type === FieldType.TEXT) {
            cellValue = <div className="whitespace-nowrap overflow-ellipsis overflow-hidden max-w-52">{cellValue || <i>Нет текста</i>}</div>;
          }
          if (field.type === FieldType.COLOR) {
            cellValue = (
              <div style={{
                height: '20px',
                backgroundColor: cellValue || 'transparent',
                padding: 4,
                margin: 4,
                borderRadius: 4,
                boxSizing: 'content-box',
              }}
              >
                {cellValue || 'Нет значения'}
              </div>
            );
          }
          if (field.type === FieldType.GEO) {
            return (
              <div className="flex items-center">
                {cellValue?.lat && cellValue?.lng ? (
                  <span>
                    {`${cellValue.lat}, ${cellValue.lng}`}
                  </span>
                ) : (
                  <i>
                    Нет значения
                  </i>
                )}
                <IconButton onClick={() => setEditMode(true)} color="primary">
                  <MapOutlined />
                </IconButton>
              </div>
            );
          }
          if (field.type === FieldType.BLOCK) {
            cellValue = 'Блочный контент';
          }
          if (field.type === FieldType.ONE_TO_MANY_ONE) {
            cellValue = cellValue?._cms_title;
          }
          if ([
            FieldType.ONE_TO_MANY_MANY,
            FieldType.MANY_TO_MANY_FIRST,
            FieldType.MANY_TO_MANY_SECOND,
          ].includes(field.type as FieldType)) {
            cellValue = cellValue?.map((item: any) => item?._cms_title || 'Не существует').join(', ');
          }
          if (field.type === FieldType.USER_CREATOR) {
            cellValue = cellValue?.name || <i>Нет значения</i>;
          }
          if (field.type === FieldType.USER) {
            cellValue = cellValue?.name || <i>Нет значения</i>;
          }
          if (field.type === FieldType.FILE) {
            cellValue = cellValue ? (
              <div>
                {cellValue?.name}
                <a
                  href={`${window.config.server}/download/?id=${cellValue?.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(cellValue?.extension) ? (
                    <img
                      src={`${window.config.server}/download/?id=${cellValue?.id}`}
                      alt={cellValue?.name}
                      className="w-20 h-20"
                    />
                  ) : null}
                  <IconButton>
                    <Download />
                  </IconButton>
                </a>
              </div>
            ) : null;
          }

          if (field.type === FieldType.FILE_GALLERY) {
            cellValue = cellValue.length ? (
              cellValue.map((file: IFile) => (
                <div key={file.id}>
                  {file?.name}
                  <a
                    href={`${window.config.server}/download/?id=${file?.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(file?.extension) ? (
                      <img
                        src={`${window.config.server}/download/?id=${file?.id}`}
                        alt={file?.name}
                        className="w-20 h-20"
                      />
                    ) : null}
                    <IconButton>
                      <Download />
                    </IconButton>
                  </a>
                </div>
              ))
            ) : null;
          }

          if (cellValue === '' || cellValue === null || cellValue === undefined) {
            cellValue = <i>Нет значения</i>;
          }
          return (
            <div onClick={() => setEditMode(true)}>
              {cellValue}
            </div>
          );
        },
      }),
    )];
    result.push({
      enableColumnOrdering: false,
      header: '+',
      Header: () => {
        const dropDownRef = useRef();
        const [dropDownOpen, setDropDownOpen] = useState(false);

        return (
          <div>
            <IconButton
              ref={dropDownRef as any}
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
              <AddField
                onClose={() => setDropDownOpen(false)}
                refetch={handleRefetch}
                meta={meta}
              />
            </Popover>
          </div>
        );
      },
      enableColumnActions: false,
    });
    return result;
  }, [meta?.fields, handleRefetch, updateRow]);

  const handleDeleteRow = async (row: any) => {
    try {
      await client.mutate({
        mutation: gql`
            mutation {
                delete${meta!.dbName}(id: "${row.original.id}")
            }
        `,
      });
      removeRow(row.original.id);
    } catch (e) {
      console.error('Error deleting row:', e);
    }
  };

  const handleModalClose = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  const handleModalSuccess = useCallback(async () => {
    await handleRefetch();
    handleModalClose();
  }, [handleRefetch, handleModalClose]);

  if (loading) return <LoadingCircle />;
  if (error) {
    return (
      <div>
        Error:
        {error.message}
      </div>
    );
  }
  if (!meta || !data) return null;

  const handleExportCSV = () => {
    if (!meta || !data) return;

    const csvRows = data.map((row: any) => {
      const result: any = {};
      result.id = row.id;
      meta.fields.forEach((field: TableField) => {
        const value = row[field.dbName];

        switch (field.type) {
          case FieldType.DATE_TIME:
            result[field.name] = `${dayjs(value).format('YYYY-MM-DD HH:mm')}`;
            return;
          case FieldType.ONE_TO_MANY_ONE:
            result[field.name] = `${value?._cms_title || ''}`;
            return;
          case FieldType.MANY_TO_MANY_FIRST:
          case FieldType.MANY_TO_MANY_SECOND:
          case FieldType.ONE_TO_MANY_MANY:
            result[field.name] = `${(value || []).map((item: any) => item?._cms_title).join(', ')}`;
            return;
          case FieldType.USER:
          case FieldType.USER_CREATOR:
            result[field.name] = `${value?.name || ''}`;
            return;
          default:
            result[field.name] = `${value || ''}`;
        }
      });
      result.createdAt = `${dayjs(row.createdAt).format('YYYY-MM-DD HH:mm')}`;
      result.updatedAt = `${dayjs(row.updatedAt).format('YYYY-MM-DD HH:mm')}`;
      result.createdBy = `${row.createdBy?.name || ''}`;
      result.updatedBy = `${row.updatedBy?.name || ''}`;
      return result;
    });

    const csvConfig = mkConfig({
      fieldSeparator: ',',
      decimalSeparator: '.',
      useKeysAsHeaders: true,
      filename: `${meta.dbName}-export-${dayjs().format('YYYY-MM-DD')}`,
    });

    const csv = generateCsv(csvConfig)(csvRows);
    download(csvConfig)(csv);
  };

  return (
    <div className="rounded-lg p-4 shadow-lg bg-white">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">{meta?.name}</h2>
          {meta.isSystem && <div className="text-red-600">Системная таблица</div>}
        </div>
        <div className="flex gap-4">
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push(`/admin/tables/${id}/privileges`)}
            className="normal-case"
          >
            Настроить права
          </Button>
          <Button
            variant="contained"
            onClick={handleExportCSV}
            className="normal-case"
            startIcon={<Download />}
          >
            Экспорт CSV
          </Button>
          {/* <Button
          variant="contained"
          onClick={() => setIsEditModalOpen(true)}
          className="normal-case"
          >
            Редактировать таблицу
          </Button> */}
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
        tableId={id as string}
      />

      <MaterialReactTable
        columns={columns}
        data={data}
        enableRowActions
        enableColumnOrdering
        onColumnOrderChange={async (order) => {
          const positions = (order as string[]).filter((item) => item !== '+' && item !== 'mrt-row-actions')
            .map((item, index) => ({
              id: meta.fields.find((field: IField) => field.dbName === item)?.id,
              position: index,
            }));
          await sortFields({
            variables: {
              tableId: id,
              positions,
            },
          });
          handleRefetch();
        }}
        renderRowActions={({ row }) => (
          <div className="flex gap-1">
            <IconButton
              color="primary"
              onClick={() => handleOpenEditDialog(row.original)}
            >
              <Edit />
            </IconButton>
            {!meta.isSystem && (
              <IconButton
                color="error"
                onClick={() => handleDeleteRow(row)}
                className="hover:bg-red-50"
              >
                <Delete />
              </IconButton>
            )}
          </div>
        )}
        state={{
          isLoading: loading,
          columnOrder: ['mrt-row-actions',
            'id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy',
            ...fields.map((field: TableField) => field.dbName), '+'],
        }}
        initialState={{
          columnVisibility: {
            id: false,
            createdAt: false,
            updatedAt: false,
            createdBy: false,
            updatedBy: false,
          },
        }}
        muiTablePaperProps={{
          elevation: 0,
          sx: {
            borderRadius: '0',
            border: '1px solid #e0e0e0',
          },
        }}
      />

      <RowDialog
        open={rowDialogOpen}
        onClose={() => setRowDialogOpen(false)}
        mode={rowDialogMode}
        initialData={currentRow}
        meta={meta}
        onSave={async (form) => {
          const normalizedInput = getNormalizedInput(form, rowDialogMode === 'edit' ? currentRow : null, meta.fields);
          if (rowDialogMode === 'create') {
            const newRow = await addRow(normalizedInput);
            if (newRow) {
              addRowToData(newRow);
            }
          } else {
            const updatedRow = await editRow(currentRow.id, normalizedInput);
            if (updatedRow) {
              updateRow(currentRow.id, updatedRow);
            }
          }
        }}
      />

      <div className="mt-4">
        {!meta.isSystem && (
          <Button
            variant="contained"
            onClick={handleOpenAddDialog}
            className="normal-case"
          >
            Добавить строку
          </Button>
        )}
      </div>

      <FieldPrivilegesDialog
        open={isFieldPrivilegesDialogOpen}
        onClose={() => setIsFieldPrivilegesDialogOpen(false)}
        field={selectedField}
      />
    </div>
  );
}

export default TablePage;
