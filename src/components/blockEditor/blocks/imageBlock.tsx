import { gql, useMutation, useQuery } from '@apollo/client';
import { BlockNoteEditor, insertOrUpdateBlock } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import { Article } from '@mui/icons-material';
import { Button, Dialog, DialogContent } from '@mui/material';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { TextInput } from '@mantine/core';
import { IFile } from '../../entities/IFile';
// eslint-disable-next-line import/no-cycle
import { toBase64 } from '../../form';

function FileDialog(props: {
  fileId?: string,
  onChange: (fileId: string, name: string) => void
}) {
  const router = useRouter();
  const [openFileDialog, setOpenFileDialog] = useState(false);

  const { loading, data, refetch } = useQuery(gql`
    query {
      getFiles {
        id
        name
        size
        extension
        createdAt
        updatedAt
      }
    }
  `, {
    skip: !openFileDialog,
  });

  const [createFile] = useMutation(gql`
    mutation createFile($input: FileInput!) {
      createFile(input: $input) {
        id
      }
    }
    `);

  const [file, setFile] = useState<{
    name: string;
    content: string;
  } | null>(null);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Имя',
        size: 150,
      },
      {
        accessorKey: 'size',
        header: 'Размер',
        size: 150,
      },
      {
        accessorKey: 'actions',
        header: 'Действия',
        size: 300,
        Cell: ({ row }: { row: any }) => (
          <div className="flex gap-2">
            {['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(row.original.extension) ? (
              <img
                src={`${window.config.server}/download/?id=${row.original.id}`}
                alt={row.original.name}
                className="w-20 h-20"
              />
            ) : null}
            <Button
              onClick={() => {
                props.onChange(row.original.id, row.original.name);
                setOpenFileDialog(false);
              }}
            >
              Выбрать
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

  const sortedData = (data?.getFiles || []).sort((a: IFile, b: IFile) => (
    a.createdAt > b.createdAt ? -1 : 1));

  const selectedFile = sortedData.find((f: IFile) => f.id === props.fileId);

  return (
    <>
      {['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(selectedFile?.extension) ? (
        <img
          src={`${window.config.server}/download/?id=${selectedFile?.id}`}
          alt={selectedFile.name}
          className="w-20 h-20"
        />
      ) : null}
      {selectedFile?.name}
      <Button
        onClick={() => setOpenFileDialog(true)}
      >
        Выбрать из галереи
      </Button>
      <Dialog open={openFileDialog} onClose={() => setOpenFileDialog(false)} fullWidth>
        <DialogContent>
          <div>
            Добавить файл:
            {' '}
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
            <Button
              onClick={async () => {
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
                }
              }}
            >
              Загрузить
            </Button>
          </div>

          <MaterialReactTable
            columns={columns}
            data={sortedData}
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
            renderTopToolbarCustomActions={() => (
              <div className="px-4 py-2">
                <h1 className="text-xl font-bold">Файлы</h1>
              </div>
            )}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

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

export const BlockEditorImageBlock = createReactBlockSpec(
  {
    type: 'cms-image',
    propSchema: {
      cssClass: {
        default: '',
        type: 'string',
      },
      width: {
        default: '100%',
        type: 'string',
      },
      height: {
        default: 'auto',
        type: 'string',
      },
      fileId: {
        default: '',
        type: 'string',
      },
    },
    content: 'none',
    isSelectable: false,
  },
  {
    render: (props) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { data } = useQuery(
        GET_FILE,
        {
          variables: { id: props.block.props.fileId },
          skip: !props.block.props.fileId,
        },
      );

      return (
        <div className="flex gap-2" data-widget-type="image">
          {
            props.editor.isEditable && (
              <div>
                <div>
                  <FileDialog
                    fileId={props.block.props.fileId}
                    onChange={(fileId) => {
                      props.editor.updateBlock(
                        props.block,
                        { props: {
                          ...props.block.props,
                          fileId,
                        } },
                      );
                    }}
                  />
                </div>
                <div>
                  <TextInput
                    size="small"
                    label="Ширина"
                    value={props.block.props.width}
                    onChange={(e) => {
                      props.editor.updateBlock(
                        props.block,
                        { props: {
                          ...props.block.props,
                          width: e.target.value,
                        } },
                      );
                    }}
                  />
                </div>
                <div>
                  <TextInput
                    size="small"
                    label="Высота"
                    value={props.block.props.height}
                    onChange={(e) => {
                      props.editor.updateBlock(
                        props.block,
                        { props: {
                          ...props.block.props,
                          height: e.target.value,
                        } },
                      );
                    }}
                  />
                </div>
                <div>
                  <TextInput
                    size="small"
                    label="CSS класс"
                    value={props.block.props.cssClass}
                    onChange={(e) => {
                      props.editor.updateBlock(
                        props.block,
                        { props: {
                          ...props.block.props,
                          cssClass: e.target.value,
                        } },
                      );
                    }}
                  />
                </div>
              </div>
            )
          }
          {(data?.getFile && ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(data.getFile.extension)) ? (
            <div className={props.block.props.cssClass}>
              <img
                src={`${window.config.server}/download/?id=${data.getFile.id}`}
                alt={data.getFile.id}
                style={{
                  width: props.block.props.width,
                  height: props.block.props.height,
                }}
              />
            </div>
          ) : null}
        </div>
      );
    },
  },
);

export const insertBlockEditorImageBlock = (editor: BlockNoteEditor) => (
  {
    title: 'Картинка из галереи',
    onItemClick: () => {
      insertOrUpdateBlock(editor, {
        type: 'cms-image' as any,
        props: {
        } as any,
      });
    },
    aliases: [
      'cms-image',
    ],
    group: 'Базовые блоки',
    icon: <Article />,
  }
);
