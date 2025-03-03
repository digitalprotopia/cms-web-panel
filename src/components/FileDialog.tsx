import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { gql, useQuery } from '@apollo/client';

const GET_FILES = gql`
    query GetFiles {
        files {
            id
            name
        }
    }
`;

interface FileDialogProps {
    fileId?: string;
    onChange: (fileId: string) => void;
}

const FileDialog: React.FC<FileDialogProps> = ({ fileId, onChange }) => {
    const [open, setOpen] = useState(false);
    const { data, loading, error } = useQuery(GET_FILES);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSelectFile = (id: string) => {
        onChange(id);
        handleClose();
    };

    return (
        <div>
            <Button variant="outlined" onClick={handleOpen}>
                {fileId ? 'Изменить файл' : 'Выбрать файл'}
            </Button>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Выберите файл</DialogTitle>
                <DialogContent>
                    {loading && <p>Загрузка...</p>}
                    {error && <p>Ошибка загрузки файлов.</p>}
                    {data && (
                        <List>
                            {data.files.map((file: { id: string; name: string }) => (
                                <ListItem key={file.id}>
                                    <ListItemButton onClick={() => handleSelectFile(file.id)}>
                                        <ListItemText primary={file.name} />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Отмена
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default FileDialog;