import { IEntity } from './IEntity';

export interface IForm extends IEntity {
  title: string;
  name: string;
  tableId: string;
  cssClass: string;
  // templateId: string;
  // TODO: Доступы
}
