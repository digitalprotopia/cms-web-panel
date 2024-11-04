import { IEntity } from './IEntity';

export interface IPage extends IEntity {
  title: string;
  content: string;
  parentId: string;
}