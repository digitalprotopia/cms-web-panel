import { IEntity } from './IEntity';
import { IRole } from './IRole';
import { ISite } from './ISite';

export enum SiteItemType {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
}

export const siteItemTypeNames = {
  static: 'Статическая',
  dynamic: 'Динамическая',
};

export interface ISiteItem extends IEntity {
  name: string;
  title: string;
  url: string;
  siteId: string;
  site: ISite;
  parentId?: string;
  isRoot: boolean;
  seotag: string;
  html: string;
  blockContent: any;
  roleIds?: string[];
  roles?: IRole[];
  type: SiteItemType;
}
