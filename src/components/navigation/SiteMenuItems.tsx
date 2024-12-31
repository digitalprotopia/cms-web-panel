import { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { gql, useMutation, useQuery } from '@apollo/client';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { ISiteMenuItem } from '../entities/ISiteMenuItem';
import { ISiteItem } from '../entities/ISiteItem';

const GET_SITE_PAGES = gql`
  query GetAllSiteItems {
    getAllSiteItems {
      id
      name
      title
      url
      parentId
      isRoot
      type
    }
  }
`;

const CREATE_MENU_ITEM = gql`
  mutation CreateSiteMenuItem($input: SiteMenuItemInput!) {
    createSiteMenuItem(input: $input) {
      id
      title
      url
      order
      createdAt
    }
  }
`;

const UPDATE_MENU_ITEM = gql`
  mutation UpdateSiteMenuItem($id: ID!, $input: SiteMenuItemInput!) {
    updateSiteMenuItem(id: $id, input: $input) {
      id
      title
      url
      order
    }
  }
`;

const DELETE_MENU_ITEM = gql`
  mutation DeleteSiteMenuItem($id: ID!) {
    deleteSiteMenuItem(id: $id)
  }
`;

interface SiteMenuItemsProps {
  items: ISiteMenuItem[];
  menuId: string;
  onUpdate: () => void;
}

interface MenuItemFormData {
  title: string;
  url: string;
}

type ItemType = 'custom' | 'page';

export default function SiteMenuItems({ items, menuId, onUpdate }: SiteMenuItemsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ISiteMenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItemFormData>({ title: '', url: '' });
  const [itemType, setItemType] = useState<ItemType>('custom');
  const [selectedPageId, setSelectedPageId] = useState<string>('');

  const { data: pagesData } = useQuery<{ getAllSiteItems: ISiteItem[] }>(GET_SITE_PAGES);

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingItem(null);
    setFormData({ title: '', url: '' });
    setItemType('custom');
    setSelectedPageId('');
  };

  const [createMenuItem] = useMutation(CREATE_MENU_ITEM, {
    onCompleted: () => {
      onUpdate();
      handleCloseDialog();
    },
  });

  const [updateMenuItem] = useMutation(UPDATE_MENU_ITEM, {
    onCompleted: () => {
      onUpdate();
      handleCloseDialog();
    },
  });

  const [deleteMenuItem] = useMutation(DELETE_MENU_ITEM, {
    onCompleted: onUpdate,
  });

  const handleEditClick = (item: ISiteMenuItem) => {
    setEditingItem(item);
    setFormData({ title: item.title, url: item.url });
  };

  const handleSubmit = async () => {
    if (editingItem) {
      await updateMenuItem({
        variables: {
          id: editingItem.id,
          input: {
            ...formData,
            menuId,
            order: editingItem.order,
          },
        },
      });
    } else {
      await createMenuItem({
        variables: {
          input: {
            ...formData,
            menuId,
            order: items.length,
          },
        },
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот пункт меню?')) {
      await deleteMenuItem({
        variables: { id },
      });
    }
  };

  const handlePageSelect = (pageId: string) => {
    const selectedPage = pagesData?.getAllSiteItems.find((page) => page.id === pageId);
    if (selectedPage) {
      setSelectedPageId(pageId);
      setFormData({
        title: selectedPage.title,
        url: selectedPage.url,
      });
    }
  };

  const handleItemTypeChange = (_: React.MouseEvent<HTMLElement>, newType: ItemType) => {
    if (newType !== null) {
      setItemType(newType);
      setFormData({ title: '', url: '' });
      setSelectedPageId('');
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    // Calculate which items need order updates
    const startIdx = Math.min(result.source.index, result.destination.index);
    const endIdx = Math.max(result.source.index, result.destination.index);

    try {
      // First sort the items to get current order
      const sortedItems = [...items].sort((a, b) => a.order - b.order);

      // Then create reordered array with new positions
      const reorderedSortedItems = Array.from(sortedItems);
      const [movedSortedItem] = reorderedSortedItems.splice(result.source.index, 1);
      reorderedSortedItems.splice(result.destination.index, 0, movedSortedItem);

      // Update orders for affected items
      const updatePromises = reorderedSortedItems
        .map((item, index) => {
          // Only update items that have changed position
          if (index >= startIdx && index <= endIdx) {
            return updateMenuItem({
              variables: {
                id: item.id,
                input: {
                  title: item.title,
                  url: item.url,
                  menuId,
                  order: index,
                },
              },
            });
          }
          return null;
        })
        .filter(Boolean);

      // Wait for all updates to complete and then refresh the data
      await Promise.all(updatePromises);

      // Refresh the entire menu data
      onUpdate();
    } catch (error) {
      console.error('Failed to update menu items order:', error);
      // Optionally show an error message to the user
    }
  };

  // Sort items by order
  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Button variant="outlined" size="small" onClick={() => setIsCreateDialogOpen(true)}>
          Добавить пункт меню
        </Button>
      </Box>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="menu-items">
          {(provided) => (
            <List
              {...provided.droppableProps}
              ref={provided.innerRef}
              sx={{
                '& .MuiListItem-root': {
                  'bgcolor': 'background.paper',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                },
              }}
            >
              {sortedItems.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <ListItem
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      sx={{
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        ...(snapshot.isDragging && {
                          bgcolor: 'action.selected',
                        }),
                      }}
                      secondaryAction={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <IconButton onClick={() => handleEditClick(item)} size="small">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(item.id)} size="small">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      <Box
                        {...provided.dragHandleProps}
                        sx={{
                          'display': 'flex',
                          'alignItems': 'center',
                          'mr': 2,
                          'cursor': 'grab',
                          'color': 'text.secondary',
                          '&:hover': { color: 'text.primary' },
                        }}
                      >
                        <DragIcon />
                      </Box>
                      <ListItemText primary={item.title} secondary={item.url} sx={{ mr: 6 }} />
                    </ListItem>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {sortedItems.length === 0 && (
                <Typography color="text.secondary" variant="body2">
                  Нет пунктов меню
                </Typography>
              )}
            </List>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog
        open={isCreateDialogOpen || !!editingItem}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingItem ? 'Редактировать пункт меню' : 'Добавить пункт меню'}
        </DialogTitle>
        <DialogContent>
          {!editingItem && (
            <Box sx={{ mb: 2, mt: 1 }}>
              <ToggleButtonGroup
                value={itemType}
                exclusive
                onChange={handleItemTypeChange}
                fullWidth
                size="small"
              >
                <ToggleButton value="custom">Произвольная ссылка</ToggleButton>
                <ToggleButton value="page">Страница сайта</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}

          {itemType === 'page' && !editingItem ? (
            <FormControl fullWidth margin="normal">
              <InputLabel>Выберите страницу</InputLabel>
              <Select
                value={selectedPageId}
                label="Выберите страницу"
                onChange={(e) => handlePageSelect(e.target.value)}
              >
                {pagesData?.getAllSiteItems.map((page) => (
                  <MenuItem key={page.id} value={page.id}>
                    {page.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <>
              <TextField
                label="Название"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                fullWidth
                margin="normal"
              />
              <TextField
                label="URL"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                fullWidth
                margin="normal"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.title || !formData.url}
          >
            {editingItem ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
