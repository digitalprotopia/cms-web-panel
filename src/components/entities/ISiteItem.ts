import { IEntity } from './IEntity';
import { IRole } from './IRole';

export enum SiteItemType {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
}

export interface ISiteItem extends IEntity {
  name: string;
  title: string;
  url: string;
  parentId?: string;
  isRoot: boolean;
  seotag: string;
  html: string;
  roleIds?: string[];
  roles?: IRole[];
  type: SiteItemType;
}
