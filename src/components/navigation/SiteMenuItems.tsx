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
import { ISiteMenuItem } from '../entities/ISiteMenuItem';
import { ISiteItem } from '../entities/ISiteItem';
import { CREATE_MENU_ITEM, UPDATE_MENU_ITEM, DELETE_MENU_ITEM } from '@/graphql/SiteMenuItem';
import { SiteMenuItemsProps, MenuItemFormData, ItemType, MenuItemNode } from './types/types';
import { buildMenuTree } from './utils/buildMenuTree';
import { GET_SITE_PAGES } from '@/graphql/SiteItem';

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
            order: editingItem.order,
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
            order: items.filter((item) => item.parentId === parentId).length,
          },
        },
      });
    }
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот пункт меню и все его подпункты?')) {
      const getDescendantIds = (id: string): string[] => {
        const children = items.filter((item) => item.parentId === id);
        return [id, ...children.flatMap((child) => getDescendantIds(child.id))];
      };

      const idsToDelete = getDescendantIds(itemId);

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
        ...formData,
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
    const droppableId = level === 0 ? 'droppable-root' : `droppable-${level}-${nodes[0]?.parentId}`;

    return (
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <List
            {...provided.droppableProps}
            ref={provided.innerRef}
            sx={{
              'pl': level * 3,
              '& .MuiListItem-root': {
                'bgcolor': 'background.paper',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              },
            }}
          >
            {nodes.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={false}>
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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Button
                            size="small"
                            onClick={() => {
                              setParentId(item.id);
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

    const sourceParentId =
      result.source.droppableId === 'droppable-root'
        ? undefined
        : result.source.droppableId.split('-').slice(2).join('-');

    const destinationParentId =
      result.destination.droppableId === 'droppable-root'
        ? undefined
        : result.destination.droppableId.split('-').slice(2).join('-');

    let itemsWithSameSourceParent;
    if (sourceParentId) {
      itemsWithSameSourceParent = items
        .filter((item) => item.parentId === sourceParentId)
        .sort((a, b) => a.order - b.order);
    } else {
      itemsWithSameSourceParent = items
        .filter((item) => !item.parentId)
        .sort((a, b) => a.order - b.order);
    }
    const draggedItem = itemsWithSameSourceParent[result.source.index];

    const isValidMove = !isMovingToChild(draggedItem.id, destinationParentId, items);
    if (!isValidMove) {
      return;
    }

    try {
      if (sourceParentId === destinationParentId) {
        const reorderedItems = Array.from(itemsWithSameSourceParent);
        const [movedItem] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, movedItem);

        const updatePromises = reorderedItems.map((item, index) =>
          updateMenuItem({
            variables: {
              id: item.id,
              input: {
                title: item.title,
                url: item.url,
                menuId,
                parentId: sourceParentId,
                order: index,
              },
            },
          }),
        );

        await Promise.all(updatePromises);
      } else {
        let itemsWithSameDestParent;
        if (destinationParentId) {
          itemsWithSameDestParent = items
            .filter((item) => item.parentId === destinationParentId)
            .sort((a, b) => a.order - b.order);
        } else {
          itemsWithSameDestParent = items
            .filter((item) => !item.parentId)
            .sort((a, b) => a.order - b.order);
        }

        await updateMenuItem({
          variables: {
            id: draggedItem.id,
            input: {
              title: draggedItem.title,
              url: draggedItem.url,
              menuId,
              parentId: destinationParentId,
              order: result.destination.index,
            },
          },
        });

        const updatePromises = itemsWithSameDestParent.map((item, index) => {
          let newIndex = index;
          if (index >= result.destination!.index) {
            newIndex = index + 1;
          }

          return updateMenuItem({
            variables: {
              id: item.id,
              input: {
                title: item.title,
                url: item.url,
                menuId,
                parentId: destinationParentId,
                order: newIndex,
              },
            },
          });
        });

        const remainingSourceItems = itemsWithSameSourceParent.filter(
          (item) => item.id !== draggedItem.id,
        );

        const sourceUpdatePromises = remainingSourceItems.map((item, index) =>
          updateMenuItem({
            variables: {
              id: item.id,
              input: {
                title: item.title,
                url: item.url,
                menuId,
                parentId: sourceParentId,
                order: index,
              },
            },
          }),
        );

        await Promise.all([...updatePromises, ...sourceUpdatePromises]);
      }

      onUpdate();
    } catch (error) {
      console.error('Failed to update menu items:', error);
    }
  };

  const isMovingToChild = (
    draggedId: string,
    targetParentId: string | undefined,
    allItems: ISiteMenuItem[],
  ): boolean => {
    if (!targetParentId) return false;

    let currentParent = allItems.find((item) => item.id === targetParentId);
    while (currentParent) {
      if (currentParent.id === draggedId) {
        return true;
      }
      currentParent = allItems.find((item) => item.id === currentParent?.parentId);
    }
    return false;
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

          <TextField
            label="Название"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            fullWidth
            margin="normal"
          />

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
            <TextField
              label="URL"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              fullWidth
              margin="normal"
            />
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
