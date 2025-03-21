import { IEntity } from './IEntity';

export interface ICategory extends IEntity {
  id: string;
  title: string;
  parentCategoryId: string;
  parentCategory: ICategory;
  slug: string;
}
