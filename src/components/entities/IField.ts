import { IEntity } from './IEntity';

export enum FieldType {
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
  HTML = 'html',
  BLOCK = 'block',
  SLUG = 'slug',
  FILE_GALLERY = 'fileGallery',
}

export type IFieldOneToManyOptions = {
  manyTableId: string;
  manyFieldTitle: string;
};

export type IFieldManyToManyOptions = {
  secondTableId: string;
  secondFieldTitle: string;
};

export type IFieldSlugOptions = {
  sourceFieldId: string;
};

export type IFieldOptions = IFieldOneToManyOptions | IFieldManyToManyOptions | IFieldSlugOptions;

export interface IField extends IEntity {
  dbName: string;
  name: string;
  tableId: string;
  type: FieldType;
  options?: IFieldOptions;
  position: number;
  isSystem: boolean;
}
