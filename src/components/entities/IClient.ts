import { IEntity } from './IEntity';

export interface IClient extends IEntity {
  id: string;
  secret: string;
  name: string;
  type: 'marketplace' | 'service';
}