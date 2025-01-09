import { IEntity } from './IEntity';

export interface ICategory extends IEntity {
  title: string;
  slug: string;
}
