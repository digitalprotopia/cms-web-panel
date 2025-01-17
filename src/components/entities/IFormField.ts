import { IEntity } from './IEntity';
import { FieldType } from './IField';

export enum FormFieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
}

export interface IFormField extends IEntity {
  title: string;
  name: string;
  tableFieldId: string;
  formId: string;
  formFieldType: FieldType;
  cssClass: string;
  // templateId: string;
  // TODO: Доступы
}
