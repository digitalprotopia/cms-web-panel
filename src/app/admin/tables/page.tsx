"use client";

import { gql, useApolloClient, useQuery } from "@apollo/client";
import { Delete } from "@mui/icons-material";
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  TextField,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { MaterialReactTable } from "material-react-table";

function AddRow(props) {
  const [form, setForm] = useState({});
  const client = useApolloClient();
  return (
    <>
      {props.table.fields.map((field) => {
        if (field.type === "string") {
          return (
            <div key={field.id}>
              <TextField
                label={field.name}
                value={form[field.dbName] || ""}
                onChange={(e) =>
                  setForm({ ...form, [field.dbName]: e.target.value })
                }
              />
            </div>
          );
        }
        if (field.type === "boolean") {
          return (
            <div key={field.id}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form[field.dbName] || false}
                    onChange={(e) =>
                      setForm({ ...form, [field.dbName]: e.target.checked })
                    }
                  />
                }
                label={field.name}
              />
            </div>
          );
        }
        if (field.type === "date") {
          return (
            <div key={field.id}>
              <TextField
                label={field.name}
                value={form[field.dbName] || ""}
                onChange={(e) =>
                  setForm({ ...form, [field.dbName]: e.target.value })
                }
                type="date"
              />
            </div>
          );
        }
        return null;
      })}
      <div>
        <Button
          onClick={async () => {
            await client.mutate({
              mutation: gql`
            mutation($input: ${props.table.dbName}Input!) {
              create${props.table.dbName}(input: $input) {
                id
                createdAt
              }
            }
          `,
              variables: { input: form },
            });
            props.refetchData();
          }}
        >
          Add
        </Button>
      </div>
    </>
  );
}

function TablesPage(props) {
  const router = useRouter();
  const { loading, data, refetch } = useQuery(gql`
    query {
      getTables {
        id
        name
        dbName
        createdAt
      }
    }
  `);

  // Define columns for Material React Table
  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 400,
      },
      {
        accessorKey: "dbName",
        header: "DB Name",
        size: 150,
      },
      {
        accessorKey: "name",
        header: "Name",
        size: 150,
      },
      {
        accessorKey: "actions",
        header: "Actions",
        size: 300,
        Cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              onClick={() =>
                router.push(`/admin/tables/${row.original.dbName}`)
              }
            >
              View
            </Button>
            <Button
              onClick={() =>
                router.push(`/admin/tables/${row.original.dbName}/edit`)
              }
            >
              Edit
            </Button>
            <Button
              onClick={() =>
                router.push(`/admin/tables/${row.original.dbName}/templates`)
              }
            >
              Templates
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white p-4">
      <div className="mb-4">
        <Button
          variant="contained"
          onClick={() => router.push("/admin/tables/add")}
          className="mb-4"
        >
          Add New Table
        </Button>
      </div>

      <MaterialReactTable
        columns={columns}
        data={data.getTables}
        enableColumnResizing
        enableFullScreenToggle={false}
        enableDensityToggle
        enableColumnFilters
        enablePagination
        enableSorting
        muiTableProps={{
          sx: {
            tableLayout: "fixed",
          },
        }}
        renderTopToolbarCustomActions={() => (
          <div className="px-4 py-2">
            <h1 className="text-xl font-bold">Tables</h1>
          </div>
        )}
      />
    </div>
  );
}

export default TablesPage;
