import { IEntity } from './IEntity';

export interface IFeedTarget extends IEntity {
  title: string;
  name: string;
  url: string;
  idInPlatform: string;
  subIdInPlatform: string;
  defaultClientId: string;
}
