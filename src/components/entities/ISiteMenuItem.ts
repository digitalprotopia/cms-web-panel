import { IEntity } from './IEntity';

export interface ISiteMenuItem extends IEntity {
  title: string;
  url: string;
  order: number;
  menuId?: string;
  parentId?: string;
  name?: string;
}
