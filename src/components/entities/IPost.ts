import { IEntity } from './IEntity';

export interface IPost extends IEntity {
  title: string;
  content: string;
  preview: string;
  blockContent: any;
  tags?: string[];
  categoryIds?: string[];
}
