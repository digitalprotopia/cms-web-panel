import { IEntity } from './IEntity';

export interface IPage extends IEntity {
  title: string;
  content: string;
  parentId: string;
}

export interface PageFormData {
  id?: string;
  name: string;
  title: string;
  url: string;
  parentId?: string;
  isRoot?: boolean;
  seotag?: string;
  html?: string;
}
