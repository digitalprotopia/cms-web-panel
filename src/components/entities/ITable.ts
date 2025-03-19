import { IEntity } from './IEntity';
import { IField } from './IField';

export interface ITable extends IEntity {
  dbName: string;
  name: string;
  isSystem: boolean;
  fields?: IField[];
}
