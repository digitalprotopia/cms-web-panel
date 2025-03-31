import {
  useMemo, useState, useCallback, useRef, useEffect
} from 'react';
import {
  MaterialReactTable,
  MRT_Cell,
  MRT_Row,
  MRT_RowData,
  type MRT_ColumnDef,
} from 'material-react-table';
import {
  Button,
  IconButton,
  TextField,
  FormControl,
  Checkbox,
  Popover,
  MenuItem,
  Select,
  InputLabel, 
  DialogTitle, 
  DialogContent, 
  Dialog, 
  DialogActions, 
  Box,
  CircularProgress,
  Typography
} from '@mui/material';
import {
  Add,
  ArrowDropDown,
  Close,
  Delete,
  Download,
  MapOutlined,
  OpenInFull,
  Save,
} from '@mui/icons-material';
import {
  gql, useApolloClient, useMutation, useQuery,
} from '@apollo/client';

import TableEditor from '@/components/table-editor';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
  FieldType, IField, IFieldManyToManyOptions, IFieldOneToManyOptions,
  IFieldOptions,
} from '@/components/entities/IField';
import { useRouter } from 'next/router';
import { mkConfig, generateCsv, download } from 'export-to-csv';
import FormField, { FormFieldBlock, FormFieldHTML } from '@/components/form';
import useTable, {
  TableField,
  TableMeta,
  useAddField,
  useAddRow,
  useDeleteField,
  useEditField,
  useEditRow,
} from '../../../../components/use-table';
import '../../../../components/entities/IFieldPrivilege'
import { Privilege } from '@/components/entities/ITablePrivilege';
import { useSnackbar } from 'notistack';

const GET_ROLES = gql`
query GetRoles {
    getRoles {
        id
        title
        name
    }
}
`;

const GET_PRIVILEGES = gql`
query GetPrivilegesByFieldId($fieldId: String!) {
    getPrivilegesByFieldId(fieldId: $fieldId) {
        roleId
        privilege
    }
}
`;

const UPDATE_PRIVILEGES = gql`
mutation UpdateFieldPrivileges($fieldId: String!, $roleId: String!, $privilege: PrivilegeInput!) {
    updateFieldPrivileges(fieldId: $fieldId, roleId: $roleId, privilege: $privilege)
}
`;

interface AddRowFormProps {
  meta: TableMeta;
  refetch: () => Promise<void>;
}

// interface FormData {
//   [key: string]: string | number | boolean | Date | null;
// }

dayjs.extend(utc);
function AddRowForm({ meta, refetch }: AddRowFormProps) {
  // const [form, setForm] = useState<FormData>({});
  const addRow = useAddRow(meta.dbName);

  const handleSubmit = async () => {
    try {
      // const formattedInput = Object.fromEntries(
      //   Object.entries(form).map(([key, value]) => {
      //     const field = meta.fields.find((f) => f.dbName === key);

      //     switch (field?.type) {
      //       case 'number':
      //         return [key, value === '' ? null : Number(value)];
      //       case 'boolean':
      //         return [key, Boolean(value)];
      //       case 'date':
      //         return [key, value instanceof Date ? value.getTime() : null];
      //       default:
      //         return [key, value];
      //     }
      //   }),
      // );

      await addRow({});

      await refetch();
      // setForm({});
    } catch (error) {
      console.error('Error adding row:', error);
    }
  };

  // const renderField = (field: Field) => {
  //   switch (field.type) {
  //     case 'boolean':
  //       return (
  //         <div key={field.id} className="w-full md:w-1/2 lg:w-1/3 p-2">
  //           <FormControl fullWidth className="mt-2">
  //             <FormControlLabel
  //               control={(
  //                 <Checkbox
  //                   checked={Boolean(form[field.dbName])}
  //                   onChange={(e) => setForm((prev) => ({
  //                     ...prev,
  //                     [field.dbName]: e.target.checked,
  //                   }))}
  //                 />
  //               )}
  //               label={field.name}
  //               className="m-0"
  //             />
  //           </FormControl>
  //         </div>
  //       );

  //     case 'date':
  //       return (
  //         <div key={field.id} className="w-full md:w-1/2 lg:w-1/3 p-2">
  //           <DateTimePicker
  //             label={field.name}
  //             value={form[field.dbName] ? dayjs(form[field.dbName] as any) : null}
  //             onChange={(newValue) => setForm((prev) => ({
  //               ...prev,
  //               [field.dbName]: newValue ? newValue.toDate() : null,
  //             }))}
  //             slotProps={{
  //               textField: {
  //                 size: 'small',
  //                 fullWidth: true,
  //                 className: 'mt-2',
  //               },
  //             }}
  //           />
  //         </div>
  //       );

  //     case 'number':
  //       return (
  //         <div key={field.id} className="w-full md:w-1/2 lg:w-1/3 p-2">
  //           <TextField
  //             fullWidth
  //             label={field.name}
  //             type="number"
  //             variant="outlined"
  //             size="small"
  //             className="mt-2"
  //             value={form[field.dbName] || ''}
  //             onChange={(e) => {
  //               const value = e.target.value === '' ? '' : Number(e.target.value);
  //               setForm((prev) => ({ ...prev, [field.dbName]: value }));
  //             }}
  //           />
  //         </div>
  //       );

  //     default: // string
  //       return (
  //         <div key={field.id} className="w-full md:w-1/2 lg:w-1/3 p-2">
  //           <TextField
  //             fullWidth
  //             label={field.name}
  //             variant="outlined"
  //             size="small"
  //             className="mt-2"
  //             value={form[field.dbName] || ''}
  //             onChange={(e) => setForm((prev) => ({ ...prev, [field.dbName]: e.target.value }))}
  //           />
  //         </div>
  //       );
  //   }
  // };

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

interface CellEditProps {
  cell: MRT_Cell<MRT_RowData>,
  row: MRT_Row<MRT_RowData>,
  field: TableField,
  meta: TableMeta,
  refetch: () => Promise<void>,
  setEditMode: (value: boolean) => void,
}

function CellEdit({
  cell, row, field, meta, refetch, setEditMode,
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
  const editRow = useEditRow(meta.dbName);

  if (field.type === FieldType.USER_CREATOR) {
    return null;
  }

  const handleSave = async (saveValue?: any) => {
    const updatedValue = saveValue !== undefined ? saveValue : value;

    if (saveValue !== undefined) {
      setValue(updatedValue);
    }

    await editRow(row.original.id, {
      [field.dbName]: updatedValue,
    });

    refetch();
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
          onChange={(e) => {
            editRow(row.original.id, {
              [field.dbName]: e.target.checked,
            });
            refetch();
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
  let options:(IFieldOptions | undefined);
  if (form.type === FieldType.ONE_TO_MANY_ONE) {
    options = oneToManyOptions!;
  }
  if (form.type === FieldType.MANY_TO_MANY_FIRST) {
    options = manyToManyOptions!;
  }
  const addField = useAddField(meta.id, form.type!);
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
        onChange={(e) => setForm((prev) => ({ ...prev, dbName: e.target.value }))}
      />

      {form.type === FieldType.ONE_TO_MANY_ONE
      && (
      <TextField
        fullWidth
        size="small"
        label="Таблица"
        select
        value={oneToManyOptions.manyTableId}
        onChange={(e) => setOneToManyOptions((prev) => ({ ...prev, manyTableId: e.target.value }))}
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
            .filter((key) => ![FieldType.ONE_TO_MANY_MANY,
              FieldType.MANY_TO_MANY_SECOND].includes(key))
            .map((key) => (
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
        }}
        disabled={!form.name || !form.dbName || !form.type}
        className="mt-2"
      >
        Добавить
      </Button>
    </div>
  );
}

function TablePage() {
  const router = useRouter();
  const { id } = router.query;
  const client = useApolloClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tableMetadata, setTableMetadata] = useState<TableMeta | null>(null);

  const {
    data, meta, loading, error, refetch,
  } = useTable(id as string, {
    onMetaLoaded: (_meta) => {
      setTableMetadata(_meta);
    },
    // onDataLoaded: (_data) => {
    //   // console.log('Table data loaded:', data);
    // },
  });

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
    // if (!meta?.fields) return [];

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
          return (
            <div
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              {field.name}
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
                    {field.type}
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
                    onChange={(e) => setEditForm((prev) => ({ ...prev, dbName: e.target.value }))}
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
                  
                  <Button
                    variant="contained"
                    onClick={() => {
                      setSelectedField(field);
                      setDropDownOpen(false);
                      setIsFieldPrivilegesDialogOpen(true);
                    }}
                    className="mt-2 normal-case"
                  >
                    Редактировать права поля
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
          if (editMode || field.type === FieldType.BOOLEAN) {
            return (
              <CellEdit
                cell={cell}
                row={row}
                field={field}
                meta={meta}
                refetch={handleRefetch}
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
          if (field.type === FieldType.ONE_TO_MANY_ONE) {
            cellValue = cellValue?._cms_title;
          }
          if ([FieldType.ONE_TO_MANY_MANY,
            FieldType.MANY_TO_MANY_FIRST,
            FieldType.MANY_TO_MANY_SECOND]
            .includes(field.type as FieldType)) {
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
                  {['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(cellValue?.extension) ? (
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

          if ([FieldType.HTML, FieldType.BLOCK].includes(field.type)) setEditMode(true);

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
  }, [meta?.fields]);

  const handleDeleteRow = async (row: any) => {
    try {
      await client.mutate({
        mutation: gql`
            mutation {
                delete${meta!.dbName}(id: "${row.original.id}")
            }
        `,
      });
      await handleRefetch();
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
        <h2 className="text-2xl font-semibold">{meta?.name}</h2>
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
          <IconButton
            color="error"
            onClick={() => handleDeleteRow(row)}
            className="hover:bg-red-50"
          >
            <Delete />
          </IconButton>
        )}
        state={{
          isLoading: loading,
          columnOrder: ['mrt-row-actions',
            'id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy',
            ...fields.map((field) => field.dbName), '+'],
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
      
      <AddRowForm meta={meta} refetch={handleRefetch} />
      <FieldPrivilegesDialog
      open={isFieldPrivilegesDialogOpen}
      onClose={() => setIsFieldPrivilegesDialogOpen(false)}
      field={selectedField}
    />
    </div>
  );
}
function FieldPrivilegesDialog({
  open,
  onClose,
  field,
}: {
  open: boolean;
  onClose: () => void;
  field: IField | null;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [privileges, setPrivileges] = useState<Record<string, Privilege>>({});
  
  const { 
    data: rolesData, 
    loading: rolesLoading, 
    error: rolesError 
  } = useQuery(GET_ROLES);

  const { 
    data: privilegesData, 
    loading: privilegesLoading, 
    error: privilegesError, 
    refetch: refetchPrivileges 
  } = useQuery(GET_PRIVILEGES, { 
    variables: { fieldId: field?.id },
    skip: !field?.id || !open
  });

  // Используем useMutation для обновления привилегий
  const [updatePrivilege] = useMutation(UPDATE_PRIVILEGES, {
    onCompleted: () => {
      enqueueSnackbar('Права успешно обновлены!', { variant: 'success' });
      refetchPrivileges();
    },
    onError: (error) => {
      enqueueSnackbar(`Ошибка при обновлении прав: ${error.message}`, { variant: 'error' });
    }
  });

  // Инициализация состояния привилегий
  useEffect(() => {
    if (privilegesData) {
      const newPrivileges = privilegesData.getPrivilegesByFieldId.reduce((acc, { roleId, privilege }) => {
        acc[roleId] = privilege;
        return acc;
      }, {});
      setPrivileges(newPrivileges);
      console.log('###################', newPrivileges)
      console.log('###################', setPrivileges(newPrivileges))

    }
  }, [privilegesData]);

  const handlePrivilegeChange = (roleId: string, newPrivilege: Privilege) => {
    setPrivileges(prev => ({
      ...prev,
      [roleId]: newPrivilege
    }));
  };

  const handleSave = async () => {
    if (!field?.id) return;

    try {
      // Обновляем привилегии для каждой роли
      await Promise.all(
        Object.entries(privileges).map(([roleId, privilege]) => {
          return updatePrivilege({
            variables: {
              fieldId: field.id,
              roleId,
              privilege: { privilege }
            }
          });
        })
      );
      onClose();
    } catch (error) {
      console.error('Error saving privileges:', error);
    }
  };

  if (rolesLoading || privilegesLoading) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>
          Права доступа для поля: <strong>{field?.name}</strong>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (rolesError || privilegesError) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>
          Права доступа для поля: <strong>{field?.name}</strong>
        </DialogTitle>
        <DialogContent>
          <Typography color="error">
            Ошибка загрузки данных: {rolesError?.message || privilegesError?.message}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Права доступа для поля: <strong>{field?.name}</strong>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ marginTop: 2 }}>
          {rolesData?.getRoles?.map((role) => (
            <Box key={role.id} mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                {role.title || role.name}
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={privileges[role.id] || Privilege.READ}
                  onChange={(e) => handlePrivilegeChange(role.id, e.target.value as Privilege)}
                >
                  <MenuItem value={Privilege.READ}>Чтение</MenuItem>
                  <MenuItem value={Privilege.CREATE}>Создание</MenuItem>
                  <MenuItem value={Privilege.EDIT}>Редактирование</MenuItem>
                  <MenuItem value={Privilege.DELETE}>Удаление</MenuItem>
                </Select>
              </FormControl>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button 
          variant="contained" 
          onClick={handleSave}
          disabled={rolesLoading || privilegesLoading}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TablePage;
