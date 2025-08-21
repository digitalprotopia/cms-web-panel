import { IEntity } from './IEntity';

export interface IPost extends IEntity {
  title: string;
  slug: string;
  content: string;
  preview: string;
  blockContent: any;
  tags?: string[];
  categoryIds?: string[];
  roleIds?: string[];
  file?: string | null;
}
