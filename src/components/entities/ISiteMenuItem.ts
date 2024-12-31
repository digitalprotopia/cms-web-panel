import { IEntity } from './IEntity';
import { ISite } from './ISite';
import { ISiteMenu } from './ISiteMenu';

export interface ISiteMenuItem extends IEntity {
  title: string;
  url: string;
  order: number;
  siteId?: ISite['id'];
  menuId: ISiteMenu['id'];
  parentId?: ISiteMenuItem['id'];
}
