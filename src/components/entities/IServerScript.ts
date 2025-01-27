import { IEntity } from './IEntity';

export interface IServerScript extends IEntity {
  title: string;
  name: string;
  code: string;
}