import { IEntity } from './IEntity';

export enum FieldType {
  STRING = 'string',
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  GEO = 'geo',
}

export interface IField extends IEntity {
  dbName: string;
  name: string;
  tableId: string;
  type: FieldType;
}
