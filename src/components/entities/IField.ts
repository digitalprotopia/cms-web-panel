import { IEntity } from './IEntity';

export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
}

export interface IField extends IEntity {
  dbName: string;
  name: string;
  tableId: string;
  type: FieldType;
}
