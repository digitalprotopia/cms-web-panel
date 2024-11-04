import { IEntity } from './IEntity';

export interface ITemplate extends IEntity {
  title: string;
  html: string;
  css: string;
  isMultiple: boolean;
}