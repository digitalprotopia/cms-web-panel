import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { gql, useMutation } from "@apollo/client";

const CREATE_TABLE = gql`
  mutation CreateTable($input: TableInput!) {
    createTable(input: $input) {
      id
      name
      dbName
      fields {
        id
        name
        dbName
        type
      }
      createdAt
    }
  }
`;

const ADD_FIELDS = gql`
  mutation AddFields($tableId: ID!, $inputs: [FieldInput]!) {
    addFields(tableId: $tableId, inputs: $inputs) {
      id
      name
      dbName
      type
    }
  }
`;

const initialFormState = {
  name: "",
  dbName: "",
  fields: [{ name: "", dbName: "", type: "string" }],
};

const TableEditor = ({
  open,
  onClose,
  onSuccess,
  mode = "create",
  initialData = {},
  tableId = {},
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [newFields, setNewFields] = useState([]);
  const [createTable] = useMutation(CREATE_TABLE);
  const [addFields] = useMutation(ADD_FIELDS);

  useEffect(() => {
    if (open) {
      if (initialData && mode === "edit") {
        setFormData({
          name: initialData.name,
          dbName: initialData.dbName,
          fields: initialData.fields.map((field) => ({
            name: field.name,
            dbName: field.dbName,
            type: field.type,
          })),
        });
        setNewFields([]);
      } else {
        setFormData(initialFormState);
        setNewFields([]);
      }
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "create") {
        await createTable({
          variables: {
            input: {
              name: formData.name,
              dbName: formData.dbName,
              fields: formData.fields,
            },
          },
        });
      } else {
        if (newFields.length > 0) {
          await addFields({
            variables: {
              tableId,
              inputs: newFields.map(({ name, dbName, type }) => ({
                name,
                dbName,
                type,
              })),
            },
          });
        }
      }

      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error("Error saving table:", error);
    }
  };

  const addField = useCallback(() => {
    const newField = { name: "", dbName: "", type: "string" };
    setFormData((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
    setNewFields((prev) => [...prev, newField]);
  }, []);

  const removeField = useCallback(
    (index) => {
      const removedField = formData.fields[index];
      setFormData((prev) => ({
        ...prev,
        fields: prev.fields.filter((_, i) => i !== index),
      }));
      setNewFields((prev) => prev.filter((field) => field !== removedField));
    },
    [formData.fields],
  );

  const updateField = useCallback(
    (index, field) => {
      setFormData((prev) => ({
        ...prev,
        fields: prev.fields.map((f, i) => (i === index ? field : f)),
      }));
      if (newFields.includes(formData.fields[index])) {
        setNewFields((prev) =>
          prev.map((f) => (f === formData.fields[index] ? field : f)),
        );
      }
    },
    [formData.fields, newFields],
  );

  const isEditMode = mode === "edit";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <span className="text-xl font-semibold">
            {isEditMode ? "Редактировать таблицу" : "Создать новую таблицу"}
          </span>
        </DialogTitle>

        <DialogContent>
          <div className="flex flex-col gap-4 pt-4">
            <TextField
              label="Название таблицы"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              fullWidth
              required
              className="w-full"
            />

            <TextField
              label="Имя в базе данных"
              value={formData.dbName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dbName: e.target.value }))
              }
              fullWidth
              required
              className="w-full"
              disabled={isEditMode}
            />

            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Поля</h3>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addField}
                  variant="outlined"
                  className="normal-case"
                >
                  Добавить поле
                </Button>
              </div>

              <div className="space-y-4">
                {formData.fields.map((field, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-4 border rounded-lg bg-gray-50"
                  >
                    <div className="flex-1 space-y-4">
                      <TextField
                        label="Название поля"
                        value={field.name}
                        onChange={(e) =>
                          updateField(index, { ...field, name: e.target.value })
                        }
                        fullWidth
                        required
                        className="w-full"
                      />

                      <TextField
                        label="Имя в БД"
                        value={field.dbName}
                        onChange={(e) =>
                          updateField(index, {
                            ...field,
                            dbName: e.target.value,
                          })
                        }
                        fullWidth
                        required
                        className="w-full"
                        disabled={isEditMode && !newFields.includes(field)}
                      />

                      <FormControl fullWidth>
                        <InputLabel>Тип поля</InputLabel>
                        <Select
                          value={field.type}
                          onChange={(e) =>
                            updateField(index, {
                              ...field,
                              type: e.target.value,
                            })
                          }
                          label="Тип поля"
                          required
                          className="w-full"
                          disabled={isEditMode && !newFields.includes(field)}
                        >
                          <MenuItem value="string">Строка</MenuItem>
                          <MenuItem value="number">Число</MenuItem>
                          <MenuItem value="boolean">Логическое</MenuItem>
                          <MenuItem value="date">Дата</MenuItem>
                        </Select>
                      </FormControl>
                    </div>

                    {(!isEditMode || newFields.includes(field)) && (
                      <IconButton
                        onClick={() => removeField(index)}
                        color="error"
                        className="self-center"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>

        <DialogActions className="p-4">
          <div className="flex gap-2">
            <Button onClick={onClose} className="normal-case">
              Отмена
            </Button>
            <Button type="submit" variant="contained" className="normal-case">
              {isEditMode ? "Сохранить изменения" : "Создать таблицу"}
            </Button>
          </div>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TableEditor;
