"use client";

import { useMemo } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { Button, IconButton, TextField } from "@mui/material";
import { Delete } from "@mui/icons-material";
import { gql, useApolloClient } from "@apollo/client";
import { use, useState, useCallback } from "react";
import useTable from "../../../../components/use-table";
import TableEditor from "@/components/table-editor";
import { FormControl, FormControlLabel, Checkbox } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";

interface Field {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "date";
  dbName: string;
}

interface TableMeta {
  id: string;
  name: string;
  dbName: string;
  fields: Field[];
  createdAt: string;
}

interface AddRowFormProps {
  meta: TableMeta;
  refetch: () => Promise<void>;
}

interface FormData {
  [key: string]: string | number | boolean | Date | null;
}

function AddRowForm({ meta, refetch }: AddRowFormProps) {
  const [form, setForm] = useState<FormData>({});
  const client = useApolloClient();

  const handleSubmit = async () => {
    try {
      const formattedInput = Object.fromEntries(
        Object.entries(form).map(([key, value]) => {
          const field = meta.fields.find((f) => f.dbName === key);

          switch (field?.type) {
            case "number":
              return [key, value === "" ? null : Number(value)];
            case "boolean":
              return [key, Boolean(value)];
            case "date":
              return [key, value instanceof Date ? value.getTime() : null];
            default:
              return [key, value];
          }
        }),
      );

      await client.mutate({
        mutation: gql`
            mutation($input: ${meta.dbName}Input!) {
            create${meta.dbName}(input: $input) {
            id
            createdAt
            }
            }
        `,
        variables: { input: formattedInput },
      });

      await refetch();
      setForm({});
    } catch (error) {
      console.error("Error adding row:", error);
    }
  };

  const renderField = (field: Field) => {
    switch (field.type) {
      case "boolean":
        return (
          <div key={field.id} className="w-full md:w-1/2 lg:w-1/3 p-2">
            <FormControl fullWidth className="mt-2">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(form[field.dbName])}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [field.dbName]: e.target.checked,
                      }))
                    }
                  />
                }
                label={field.name}
                className="m-0"
              />
            </FormControl>
          </div>
        );

      case "date":
        return (
          <div key={field.id} className="w-full md:w-1/2 lg:w-1/3 p-2">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateTimePicker
                label={field.name}
                value={form[field.dbName] ? dayjs(form[field.dbName]) : null}
                onChange={(newValue) =>
                  setForm((prev) => ({
                    ...prev,
                    [field.dbName]: newValue ? newValue.toDate() : null,
                  }))
                }
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    className: "mt-2",
                  },
                }}
              />
            </LocalizationProvider>
          </div>
        );

      case "number":
        return (
          <div key={field.id} className="w-full md:w-1/2 lg:w-1/3 p-2">
            <TextField
              fullWidth
              label={field.name}
              type="number"
              variant="outlined"
              size="small"
              className="mt-2"
              value={form[field.dbName] || ""}
              onChange={(e) => {
                const value =
                  e.target.value === "" ? "" : Number(e.target.value);
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
              value={form[field.dbName] || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [field.dbName]: e.target.value }))
              }
            />
          </div>
        );
    }
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="flex flex-wrap -mx-2">
        {meta.fields.map((field) => renderField(field))}
      </div>

      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={Object.keys(form).length === 0}
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

  const { data, meta, loading, error, refetch } = useTable(id, {
    onMetaLoaded: (meta) => {
      setTableMetadata(meta);
    },
    onDataLoaded: (data) => {
      console.log("Table data loaded:", data);
    },
  });

  const handleRefetch = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error("Error refetching data:", error);
    }
  }, [refetch]);

  const columns = useMemo(() => {
    if (!meta?.fields) return [];

    return meta.fields.map((field) => ({
      accessorKey: field.dbName,
      header: field.name,
      type: field.type === "number" ? "numeric" : "string",
    }));
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
      console.error("Error deleting row:", error);
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
  if (error) return <div>Error: {error.message}</div>;
  if (!meta || !data) return null;

  return (
    <div className="rounded-lg p-4 shadow-lg bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">{meta?.name}</h2>
        <Button
          variant="contained"
          onClick={() => setIsEditModalOpen(true)}
          className="normal-case"
        >
          Редактировать таблицу
        </Button>
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
            borderRadius: "0",
            border: "1px solid #e0e0e0",
          },
        }}
      />

      <AddRowForm meta={meta} refetch={handleRefetch} />
    </div>
  );
}

export default TablePage;
