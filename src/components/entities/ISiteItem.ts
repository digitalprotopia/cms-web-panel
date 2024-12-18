import { IEntity } from './IEntity';

export enum SiteItemType {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
}

export interface ISiteItem extends IEntity {
  name: string;
  title: string;
  url: string;
  parentId: string;
  isRoot: boolean;
  seotag: string;
  html: string;
  roleIds?: string[];
  type: SiteItemType;
}