import { IEntity } from './IEntity';
import { IRole } from './IRole';

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
}
