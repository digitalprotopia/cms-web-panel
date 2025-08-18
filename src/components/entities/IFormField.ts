import { IEntity } from './IEntity';
import { IFormFieldRange } from './IFormFieldRange';

export enum FormFieldType {
  STRING = 'string',
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  GEO = 'geo',
  COLOR = 'color',
  ONE_TO_MANY_ONE = 'oneToManyOne',
  ONE_TO_MANY_MANY = 'oneToManyMany',
  MANY_TO_MANY_FIRST = 'manyToManyFirst',
  MANY_TO_MANY_SECOND = 'manyToManySecond',
  USER_CREATOR = 'userCreator',
  FILE = 'file',
  DECIMAL = 'decimal',
  DATE_TIME = 'dateTime',
  TIME = 'time',
  PHONE = 'phone',
  EMAIL = 'email',
  URL = 'url',
  CURRENCY = 'currency',
  USER = 'user',
  RANGE = 'range',
  SLUG = 'slug',
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
  options?: {
    rangeField?: IFormFieldRange;
  };
  // templateId: string;
  // TODO: Доступы
}
