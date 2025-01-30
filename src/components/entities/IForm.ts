import { IEntity } from './IEntity';

export enum FormType {
  CREATE = 'create',
  EDIT = 'edit',
}

export interface IForm extends IEntity {
  title: string;
  name: string;
  tableId: string;
  cssClass: string;
  type: FormType;
  // templateId: string;
  // TODO: Доступы
}
