import { useMemo, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Button, Dialog, DialogContent, MenuItem, TextField } from '@mui/material';
import { Editor } from '@monaco-editor/react';
// import { useRouter } from 'next/router';
import { MaterialReactTable } from 'material-react-table';
import toBase64 from '@/components/utils/toBase64';
import Image from 'next/image';
import { ITemplate, TemplateType } from './entities/ITemplate';
import { IFile } from './entities/IFile';
import TemplateBlocks from './blockEditor/blocks/templates/TemplateBlocks';

function TemplateFile(props: {
  fileId?: string,
  onChange: (fileId: string, name: string) => void
}) {
  // const router = useRouter();
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
  `);

  const [createFile] = useMutation(gql`
    mutation createFile($input: FileInput!) {
      createFile(input: $input) {
        id
      }
    }
    `);

  const [openFileDialog, setOpenFileDialog] = useState(false);
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
              <Image
                src={`${window.config.server}/download/?id=${row.original.id}`}
                alt={row.original.name}
                width={80}
                height={80}
                className="w-20 h-20"
                unoptimized
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
    [props],
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  const sortedData = data.getFiles.sort((a: IFile, b: IFile) => (
    a.createdAt > b.createdAt ? -1 : 1));

  const selectedFile = sortedData.find((f: IFile) => f.id === props.fileId);

  return (
    <>
      {['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(selectedFile?.extension) ? (
        <Image
          src={`${window.config.server}/download/?id=${selectedFile?.id}`}
          alt={selectedFile.name}
          width={80}
          height={80}
          className="w-20 h-20"
          unoptimized
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

export default function TemplateEdit({
  initialData,
  onSubmit,
  templates,
  isSystem = false,
}: {
  initialData: Partial<ITemplate>;
  onSubmit: (data: Partial<ITemplate>) => void;
  templates: ITemplate[];
  isSystem?: boolean;
}) {
  const {
    name = '', title = '', templateGroupId, html = '', css = '', file = undefined,
    blockContent = null, type = 'text',
  } = initialData as any;

  const [formData, setFormData] = useState<Partial<ITemplate>>({
    name, title, templateGroupId, html, css, fileId: file?.id, blockContent, type,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="p-4">
        {!isSystem && (
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Имя файла"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label="Заголовок"
              fullWidth
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              slotProps={{
                htmlInput: { maxLength: 255 },
              }}
            />
          </div>
        )}
        <div>
          <TextField
            select
            label="Тип"
            value={formData.type || TemplateType.TEXT}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as TemplateType })}
          >
            <MenuItem value={TemplateType.TEXT}>Текст</MenuItem>
            <MenuItem value={TemplateType.FILE}>Файл</MenuItem>
            <MenuItem value={TemplateType.BLOCKS}>Блоки</MenuItem>
          </TextField>
        </div>
        {!isSystem && (
          <div>
            <a href={`${window.config.server}/templates/${initialData.id}/${initialData.name}`} target="_blank" rel="noreferrer">
              {`URL: ${window.config.server}/templates/${initialData.id}/${initialData.name}`}
            </a>
          </div>
        )}

        {formData.type === TemplateType.TEXT ? (
          <>
            <h4>HTML</h4>
            <Editor
              value={formData.html}
              height={400}
              onChange={(value) => setFormData({ ...formData, html: value! })}
              language={formData.name!.endsWith('.css') ? 'css' : 'html'}
            />
            <div>
              <h4>Добавить ссылки на файлы</h4>
              <div style={{ height: 160, overflow: 'auto' }}>
                {templates.map((template) => (
                  <MenuItem key={template.name} onClick={() => setFormData({ ...formData, html: `${formData.html}${window.config.server}/templates/${template.id}/${template.name}` })}>
                    {template.name}
                  </MenuItem>
                ))}
              </div>
            </div>
          </>
        ) : null}
        {formData.type === TemplateType.FILE
          ? (<TemplateFile
              fileId={formData.fileId}
              onChange={(fileId, _name) => setFormData({ ...formData, fileId, name: _name })}
          />) : null}
        {formData.type === TemplateType.BLOCKS
          ? (
            <div>
              <h4>Блочный редактор</h4>
              <TemplateBlocks
                blockContent={formData.blockContent}
                onChange={(_blockContent) => setFormData(
                  { ...formData, blockContent: _blockContent },
                )}
              />
            </div>
          ) : null}
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="contained" type="submit">
            Сохранить
          </Button>
        </div>
      </form>
    </div>
  );
}
