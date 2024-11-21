import { IEntity } from './IEntity';

export interface ISiteItem extends IEntity {
  name: string;
  title: string;
  url: string;
  parentId?: string;
  isRoot: boolean;
  seotag: string;
  html: string;
}
