import React, { useState } from 'react';
import { Button, Dialog, DialogContent, Snackbar } from '@mui/material';
import { gql, useQuery, useMutation } from '@apollo/client';
import { MaterialReactTable } from 'material-react-table';
import toBase64 from '@/components/utils/toBase64';
import Image from 'next/image';

const GET_FILES = gql`
    query GetFiles {
        getFiles {
            id
            name
            size
            extension
            createdAt
            updatedAt
        }
    }
`;

const GET_FILE = gql`
    query GetFile($id: ID!) {
        getFile(id: $id) {
            id
            name
            size
            extension
            createdAt
            updatedAt
        }
    }
`;

const CREATE_FILE = gql`
    mutation CreateFile($input: FileInput!) {
        createFile(input: $input) {
            id
        }
    }
`;

interface FileDialogProps {
  fileId?: string | null;
  onChange: (fileId: string | null) => void;
}

function FileDialog({ fileId, onChange }: FileDialogProps) {
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const { data: filesData, refetch } = useQuery(GET_FILES, { skip: !open });

  const { data: fileData } = useQuery(GET_FILE, {
    variables: { id: fileId },
    skip: !fileId,
  });

  const [createFile] = useMutation(CREATE_FILE);
  const [file, setFile] = useState<{ name: string; content: string } | null>(null);

  const handleSelectFile = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const columns = [
    { accessorKey: 'name', header: 'Имя', size: 150 },
    { accessorKey: 'size', header: 'Размер', size: 150 },
    {
      accessorKey: 'actions',
      header: 'Действия',
      size: 300,
      Cell: ({ row }: { row: any }) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp'].includes(row.original.extension) && (
            <Image
              src={`${window.config.server}/download/?id=${row.original.id}`}
              alt={row.original.name}
              width={50}
              height={50}
              className="mr-2.5"
              unoptimized
            />
          )}
          <Button onClick={() => handleSelectFile(row.original.id)}>
            Выбрать
          </Button>
        </div>
      ),
    },
  ];

  const handleFileUpload = async () => {
    if (file) {
      await createFile({
        variables: {
          input: {
            file: file.content,
            name: file.name,
          },
        },
      });
      refetch();
      setSnackbarOpen(true);
    }
  };

  return (
    <div>
      {fileData && (
        <div>
          <p>
            Выбранный файл:
            {' '}
            <div>
              <Image
                src={`${window.config.server}/download/?id=${fileData.getFile.id}`}
                alt={fileData.getFile.name}
                width={50}
                height={50}
                className="mr-2.5"
                unoptimized
              />
            </div>
            <div>
              <Button
                variant="outlined"
                onClick={() => onChange(null)}
              >
                Удалить файл
              </Button>
            </div>
          </p>
        </div>
      )}
      <Button variant="outlined" onClick={() => setOpen(true)}>
        {fileId ? 'Изменить файл' : 'Выбрать картинку'}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogContent>
          <div>
            Добавить файл:
            <input
              type="file"
              onChange={async (e) => {
                if (e.target.files?.[0]) {
                  setFile({
                    name: e.target.files[0].name,
                    content: await toBase64(e.target.files[0]),
                  });
                }
              }}
            />
            <Button onClick={handleFileUpload}>
              Загрузить
            </Button>
          </div>
          <MaterialReactTable
            columns={columns}
            data={filesData?.getFiles || []}
            enableColumnResizing
            enableFullScreenToggle={false}
            enableDensityToggle
            enableColumnFilters
            enablePagination
            enableSorting
            muiTableProps={{
              sx: {
                tableLayout: 'fixed',
              },
            }}
          />
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message="Файл добавлен"
      />
    </div>
  );
}

export default FileDialog;
