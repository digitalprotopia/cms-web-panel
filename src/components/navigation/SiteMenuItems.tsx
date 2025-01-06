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
import { useMutation, useQuery } from '@apollo/client';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { CREATE_MENU_ITEM, UPDATE_MENU_ITEM, DELETE_MENU_ITEM } from '@/graphql/SiteMenuItem';
import { GET_SITE_PAGES } from '@/graphql/SiteItem';
import { ISiteMenuItem } from '../entities/ISiteMenuItem';
import { ISiteItem } from '../entities/ISiteItem';
import { SiteMenuItemsProps, MenuItemFormData, ItemType, MenuItemNode } from './types/types';
import { buildMenuTree } from './utils/buildMenuTree';

export default function SiteMenuItems({ items, menuId, onUpdate }: SiteMenuItemsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ISiteMenuItem | null>(null);
  const [formData, setFormData] = useState<MenuItemFormData>({ title: '', url: '' });
  const [itemType, setItemType] = useState<ItemType>('custom');
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [parentId, setParentId] = useState<string | undefined>(undefined);

  const { data: pagesData } = useQuery<{ getAllSiteItems: ISiteItem[] }>(GET_SITE_PAGES);

  const menuTree = buildMenuTree(items);

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
            position: editingItem.position,
            parentId: editingItem.parentId,
          },
        },
      });
    } else {
      await createMenuItem({
        variables: {
          input: {
            ...formData,
            menuId,
            parentId,
            position: items.filter((item) => item.parentId === parentId).length,
          },
        },
      });
    }
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот пункт меню и все его подпункты?')) {
      // Get all descendant items
      const getDescendantIds = (id: string): string[] => {
        const children = items.filter((item) => item.parentId === id);
        return [id, ...children.flatMap((child) => getDescendantIds(child.id))];
      };

      const idsToDelete = getDescendantIds(itemId);

      // Delete all items in sequence
      for (const id of idsToDelete) {
        await deleteMenuItem({
          variables: { id },
        });
      }
      onUpdate();
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

  const renderMenuItems = (nodes: MenuItemNode[], level: number = 0) => {
    // Generate a unique droppableId for each level
    const droppableId = level === 0 ? 'droppable-root' : `droppable-${level}-${nodes[0]?.parentId}`;

    return (
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <List
            {...provided.droppableProps}
            ref={provided.innerRef}
            sx={{
              pl: level * 3,
              '& .MuiListItem-root': {
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              },
            }}
          >
            {nodes.map((item, index) => (
              <Draggable
                key={item.id}
                draggableId={item.id}
                index={index}
                isDragDisabled={level === 0 && item.children.length > 0}
              >
                {(provided, snapshot) => (
                  <>
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
                        (<Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Button
                            size="small"
                            onClick={() => {
                              setParentId(item.id);
                              console.log(item.id);
                              setIsCreateDialogOpen(true);
                            }}
                            sx={{ mr: 1 }}
                          >
                            Добавить
                          </Button>
                          <IconButton onClick={() => handleEditClick(item)} size="small">
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDelete(item.id)} size="small">
                            <DeleteIcon />
                          </IconButton>
                        </Box>)
                      }
                    >
                      <Box
                        {...provided.dragHandleProps}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mr: 2,
                          cursor: 'grab',
                          color: 'text.secondary',
                          '&:hover': { color: 'text.primary' },
                        }}
                      >
                        <DragIcon />
                      </Box>
                      <ListItemText primary={item.title} secondary={item.url} sx={{ mr: 6 }} />
                    </ListItem>
                    {item.children.length > 0 && renderMenuItems(item.children, level + 1)}
                  </>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </List>
        )}
      </Droppable>
    );
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    // Special handling for root level
    const isRoot = result.source.droppableId === 'droppable-root';
    const sourceParentId = isRoot
      ? undefined
      : result.source.droppableId.split('-').slice(2).join('-');
    const destinationParentId = isRoot
      ? undefined
      : result.destination.droppableId.split('-').slice(2).join('-');

    // Only allow reordering within the same parent
    if (sourceParentId !== destinationParentId) {
      return;
    }

    // Get items to reorder based on whether we're handling root or nested items
    let itemsToReorder;
    if (isRoot) {
      // For root items, get all items without parentId
      itemsToReorder = items.filter((item) => !item.parentId).sort((a, b) => a.position - b.position);
    } else {
      // For nested items, get all items with the same parentId
      itemsToReorder = items
        .filter((item) => item.parentId === sourceParentId)
        .sort((a, b) => a.position - b.position);
    }

    // Create a new array with the current order
    const reorderedItems = Array.from(itemsToReorder);

    // Remove the item from its current position and insert it at the new position
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    try {
      // Update orders for all items in the reordered array
      const updatePromises = reorderedItems.map((item, index) => updateMenuItem({
        variables: {
          id: item.id,
          input: {
            title: item.title,
            url: item.url,
            menuId,
            parentId: sourceParentId, // undefined for root items, parentId for nested
            position: index,
          },
        },
      }));

      await Promise.all(updatePromises);
      onUpdate();
    } catch (error) {
      console.error('Failed to update menu items order:', error);
    }
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            setParentId(undefined);
            setIsCreateDialogOpen(true);
          }}
        >
          Добавить корневой пункт меню
        </Button>
      </Box>

      <DragDropContext onDragEnd={handleDragEnd}>
        {menuTree.length > 0 ? (
          renderMenuItems(menuTree)
        ) : (
          <Typography color="text.secondary" variant="body2">
            Нет пунктов меню
          </Typography>
        )}
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
