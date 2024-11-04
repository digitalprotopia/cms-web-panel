import { IEntity } from './IEntity';

export interface IForm extends IEntity {
  title: string;
  name: string;
  tableId: string;
  // templateId: string;
  // TODO: Доступы
}