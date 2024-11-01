"use client";

import { useMemo } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { Button, IconButton, TextField } from "@mui/material";
import { Delete } from "@mui/icons-material";
import { gql, useApolloClient } from "@apollo/client";
import { use, useState } from "react";
import useTable from "../../../../components/use-table";
import TableEditor from "@/components/table-editor";

function AddRowForm({ meta, refetch }) {
  const [form, setForm] = useState({});
  const client = useApolloClient();

  const handleSubmit = async () => {
    const formattedInput = Object.fromEntries(
      Object.entries(form).map(([key, value]) => {
        const field = meta.fields.find((f) => f.dbName === key);
        if (field?.type === "number") {
          return [key, Number(value)];
        }
        return [key, value];
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
    refetch();
    setForm({});
  };

  return (
    <div className="p-4 border-t">
      {meta.fields.map((field) => (
        <TextField
          key={field.id}
          label={field.name}
          variant="outlined"
          size="small"
          className="mr-2 mb-2"
          value={form[field.dbName] || ""}
          type={field.type === "number" ? "number" : "text"}
          onChange={(e) => {
            const value =
              field.type === "number"
                ? e.target.value === ""
                  ? ""
                  : Number(e.target.value)
                : e.target.value;
            setForm({ ...form, [field.dbName]: value });
          }}
        />
      ))}
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={Object.keys(form).length === 0}
      >
        Add Row
      </Button>
    </div>
  );
}

function TablePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const client = useApolloClient();

  const { data, meta, loading, error, refetch } = useTable(id, {
    onMetaLoaded: (meta) => {
      console.log("Table metadata loaded:", meta);
    },
    onDataLoaded: (data) => {
      console.log("Table data loaded:", data);
    },
  });

  const columns = useMemo(() => {
    if (!meta?.fields) return [];

    return meta.fields.map((field) => ({
      accessorKey: field.dbName,
      header: field.name,
      type: field.type === "number" ? "numeric" : "string",
    }));
  }, [meta?.fields]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDeleteRow = async (row) => {
    await client.mutate({
      mutation: gql`
          mutation {
              delete${meta.dbName}(id: "${row.original.id}")
          }
      `,
    });
    refetch();
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!meta || !data) return null;

  return (
    <div className="rounded p-4 shadow-lg bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl">{meta?.name}</h2>
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
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          refetch();
          setIsEditModalOpen(false);
        }}
        mode="edit"
        initialData={meta}
        tableId={id}
      />

      <MaterialReactTable
        columns={columns}
        data={data}
        enableRowActions
        renderRowActions={({ row }) => (
          <IconButton color="error" onClick={() => handleDeleteRow(row)}>
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

      <AddRowForm meta={meta} refetch={refetch} />
    </div>
  );
}

export default TablePage;
