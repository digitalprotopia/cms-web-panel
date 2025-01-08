import { IEntity } from './IEntity';
import { ISite } from './ISite';
import { ISiteItem } from './ISiteItem';
// eslint-disable-next-line import/no-cycle
import { ISiteMenu } from './ISiteMenu';

export enum ISiteMenuItemType {
  URL = 'url',
  SiteItem = 'siteItem',
}

export interface ISiteMenuItem extends IEntity {
  title: string;
  url: string;
  position: number;
  siteId?: ISite['id'];
  menuId: ISiteMenu['id'];
  parentId?: ISiteMenuItem['id'];
  siteItemId?: ISiteItem['id'];
  type: ISiteMenuItemType;
}
