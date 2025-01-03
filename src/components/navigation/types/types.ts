import { ISiteMenu } from '@/components/entities/ISiteMenu';
import { ISiteMenuItem } from '@/components/entities/ISiteMenuItem';

export interface SiteMenuItemsProps {
  items: ISiteMenuItem[];
  menuId: string;
  onUpdate: () => void;
}

export interface SiteMenuListProps {
  siteId: string;
  menus: ISiteMenu[];
  loading?: boolean;
  refetchMenus: () => Promise<any>;
}

export interface CreateMenuDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, title: string) => Promise<void>;
}

export interface EditMenuDialogProps {
  open: boolean;
  onClose: () => void;
  menu: ISiteMenu | null;
  onSuccess: () => void;
}

export interface CreateMenuItemDialogProps {
  open: boolean;
  onClose: () => void;
  menuId: string;
  siteId: string;
  onSuccess: () => void;
}

export interface MenuItemFormData {
  title: string;
  url: string;
}

export type ItemType = 'custom' | 'page';

export interface MenuItemNode extends ISiteMenuItem {
  children: MenuItemNode[];
}
