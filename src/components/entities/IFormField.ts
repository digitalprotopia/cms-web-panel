import { IEntity } from './IEntity';

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
  formFieldType: FormFieldType; 
  // templateId: string;
  // TODO: Доступы
}