import { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, Skeleton } from '@mui/material';
import { ISiteMenu } from '../entities/ISiteMenu';
import SiteMenuItems from './SiteMenuItems';
import CreateMenuItemDialog from './CreateMenuItemDialog';

interface SiteMenuListProps {
  siteId: string;
  menus: ISiteMenu[];
  loading?: boolean;
  isDefaultMenu?: boolean;
}

export default function SiteMenuList({
  siteId,
  menus,
  loading,
  isDefaultMenu = false,
}: SiteMenuListProps) {
  const [selectedMenu, setSelectedMenu] = useState<ISiteMenu | null>(null);

  if (loading) {
    return (
      <Box>
        {!isDefaultMenu && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Skeleton width={150} height={40} />
          </Box>
        )}
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
              <Button variant="outlined" size="small" onClick={() => setSelectedMenu(menu)}>
                Добавить пункт меню
              </Button>
            </Box>
            <SiteMenuItems items={menu.items} />
          </CardContent>
        </Card>
      ))}

      {menus.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          {isDefaultMenu ? 'Основное меню не настроено' : 'Дополнительные меню не найдены'}
        </Typography>
      )}

      <CreateMenuItemDialog
        open={!!selectedMenu}
        onClose={() => setSelectedMenu(null)}
        menuId={selectedMenu?.id || ''}
        siteId={siteId}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </Box>
  );
}
