import { IEntity } from './IEntity';

export enum FormFieldType {
  STRING = 'string',
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
}

export interface IFormField extends IEntity {
  title: string;
  name: string;
  description: string;
  tableFieldId: string;
  formId: string;
  formFieldType: FormFieldType;
  position: number;
  cssClass: string;
  // templateId: string;
  // TODO: Доступы
}
