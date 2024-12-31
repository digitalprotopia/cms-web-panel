import { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, Skeleton } from '@mui/material';
import { gql, useMutation } from '@apollo/client';
import { ISiteMenu } from '../entities/ISiteMenu';
import SiteMenuItems from './SiteMenuItems';
import CreateMenuItemDialog from './CreateMenuItemDialog';
import EditMenuDialog from './EditMenuDialog';

const DELETE_SITE_MENU = gql`
  mutation DeleteSiteMenu($id: ID!) {
    deleteSiteMenu(id: $id)
  }
`;

interface SiteMenuListProps {
  siteId: string;
  menus: ISiteMenu[];
  loading?: boolean;
  refetchMenus: () => Promise<any>;
}

export default function SiteMenuList({ siteId, menus, loading, refetchMenus }: SiteMenuListProps) {
  const [menuToEdit, setMenuToEdit] = useState<ISiteMenu | null>(null);
  const [menuToAddItem, setMenuToAddItem] = useState<ISiteMenu | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [deleteMenu] = useMutation(DELETE_SITE_MENU, {
    onCompleted: () => refetchMenus(),
  });

  const handleMenuUpdate = () => {
    refetchMenus();
  };

  const handleDelete = async (menuId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить это меню?')) {
      await deleteMenu({
        variables: { id: menuId },
      });
    }
  };

  if (loading) {
    return (
      <Box>
        {[1, 2].map((i) => (
          <Card key={i} sx={{ mb: 2 }}>
            <CardContent>
              <Skeleton width={150} height={24} sx={{ mb: 2 }} />
              <Skeleton width="100%" height={48} />
              <Skeleton width="100%" height={48} />
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {menus.map((menu) => (
        <Card key={menu.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">{menu.title}</Typography>
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setMenuToEdit(menu);
                    setEditDialogOpen(true);
                  }}
                  sx={{ mr: 1 }}
                >
                  Редактировать
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => handleDelete(menu.id)}
                  sx={{ mr: 1 }}
                >
                  Удалить
                </Button>
                <Button variant="outlined" size="small" onClick={() => setMenuToAddItem(menu)}>
                  Добавить пункт меню
                </Button>
              </Box>
            </Box>
            <SiteMenuItems items={menu.items} menuId={menu.id} onUpdate={handleMenuUpdate} />
          </CardContent>
        </Card>
      ))}

      {menus.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Меню не найдены. Создайте новое меню для этого сайта.
        </Typography>
      )}

      <EditMenuDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setMenuToEdit(null);
        }}
        menu={menuToEdit}
        onSuccess={handleMenuUpdate}
      />

      <CreateMenuItemDialog
        open={!!menuToAddItem}
        onClose={() => setMenuToAddItem(null)}
        menuId={menuToAddItem?.id || ''}
        siteId={siteId}
        onSuccess={() => {
          handleMenuUpdate();
          setMenuToAddItem(null);
        }}
      />
    </Box>
  );
}
