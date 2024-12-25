import { IEntity } from './IEntity';

export interface IFile extends IEntity {
  name: string;
  extension: string;
  size: number;
  file?: string;
}