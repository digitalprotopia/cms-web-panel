import { IEntity } from './IEntity';

export enum FileType {
  USER_PIC = 'userPic',
}

export interface IFile extends IEntity {
  name: string;
  extension: string;
  size: number;
  file?: string;
  type?: FileType;
}
