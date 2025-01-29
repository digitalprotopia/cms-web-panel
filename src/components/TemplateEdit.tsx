import { useMemo, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Button, Dialog, DialogContent, MenuItem, TextField } from '@mui/material';
import { Editor } from '@monaco-editor/react';
import { useRouter } from 'next/router';
import { MaterialReactTable } from 'material-react-table';
import { ITemplate, ITemplateFormData, TemplateType } from './entities/ITemplate';
import { IFile } from './entities/IFile';
import { toBase64 } from './form';

function TemplateFile(props: {
  fileId?: string,
  onChange: (fileId: string, name: string) => void
}) {
  const router = useRouter();
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
            {['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(row.original.extension) ? (
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

  const sortedData = data.getFiles.sort((a: IFile, b: IFile) => (
    a.createdAt > b.createdAt ? -1 : 1));

  const selectedFile = sortedData.find((f: IFile) => f.id === props.fileId);

  return (
    <>
      {['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(selectedFile?.extension) ? (
        <img
          src={`${window.config.server}/download/?id=${selectedFile.id}`}
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

export default function TemplateEdit({
  initialData,
  onSubmit,
  templates,
}: {
  initialData: Partial<ITemplate>;
  onSubmit: (data: ITemplateFormData) => void;
  templates: ITemplateFormData[];
}) {
  const {
    name = '', title = '', templateGroupId, html = '', css = '', file = undefined,
  } = initialData as any;

  const snippets = useQuery(gql`
    query {
      getAllWidgets {
        id
        name
        title
        createdAt
      }
      getAllForms {
        id
        name
        title
        createdAt
      }
  }`);

  const [formData, setFormData] = useState<ITemplateFormData>({
    name, title, templateGroupId, html, css, fileId: file.id,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="p-4">
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
          />
        </div>
        <div>
          <a href={`${window.config.server}/templates/${initialData.id}/${initialData.name}`} target="_blank" rel="noreferrer">
            {`URL: ${window.config.server}/templates/${initialData.id}/${initialData.name}`}
          </a>
        </div>

        {initialData.type === TemplateType.TEXT ? (
          <>
            <h4>HTML</h4>
            <Editor
              value={formData.html}
              height={400}
              onChange={(value) => setFormData({ ...formData, html: value! })}
              language={formData.name.endsWith('.css') ? 'css' : 'html'}
            />

            <div className="flex flex-wrap gap-2">
              {[{ templateName: 'Add menu', templateHTML: 'menu' },
                { templateName: 'Add content', templateHTML: 'content' },
                { templateName: 'Add title', templateHTML: 'title' },
              ]
                .map((field) => (
                  <Button
                    key={field.templateName}
                    variant="contained"
                    color="primary"
                    onClick={() => setFormData({
                      ...formData,
                      html: `${formData.html}{${field.templateHTML}}`,
                    })}
                  >
                    {`${field.templateName}`}
                  </Button>
                ))}
            </div>

            <div style={{ display: 'flex', width: '100%' }}>
              <div>
                <h4>Добавить виджеты</h4>
                <div style={{ height: 160, overflow: 'auto' }}>
                  {snippets.data?.getAllWidgets?.map((widget: any) => (
                    <MenuItem key={widget.id} onClick={() => setFormData({ ...formData, html: `${formData.html}[widget:${widget.name}]` })}>
                      {widget.title}
                    </MenuItem>
                  ))}
                </div>
              </div>
              <div>
                <h4>Добавить формы</h4>
                <div style={{ height: 160, overflow: 'auto' }}>
                  {snippets.data?.getAllForms?.map((form: any) => (
                    <MenuItem key={form.id} onClick={() => setFormData({ ...formData, html: `${formData.html}[form:${form.name}]` })}>
                      {form.title}
                    </MenuItem>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h4>Добавить шаблоны</h4>
              <div style={{ height: 160, overflow: 'auto' }}>
                {templates.map((template) => (
                  <MenuItem key={template.name} onClick={() => setFormData({ ...formData, html: `${formData.html}{include:${template.name}}` })}>
                    {template.title}
                  </MenuItem>
                ))}
              </div>
            </div>
          </>
        ) : null}
        {initialData.type === TemplateType.FILE
          ? (<TemplateFile
              fileId={formData.fileId}
              onChange={(fileId, _name) => setFormData({ ...formData, fileId, name: _name })}
          />) : null}
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="contained" type="submit">
            Сохранить
          </Button>
        </div>
      </form>
    </div>
  );
}
