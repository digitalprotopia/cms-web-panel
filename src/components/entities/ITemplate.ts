import { IEntity } from './IEntity';

export enum TemplateLanguage {
  SIMPLE = 'simple',
  REACT = 'react',
}

export enum TemplateType {
  TEXT = 'text',
  FILE = 'file',
  BLOCKS = 'blocks',
}

export interface ITemplate extends IEntity {
  name: string;
  title: string;
  templateGroupId?: string;
  html: string;
  css: string;
  blockContent: any;
  isMultiple: boolean;
  language: TemplateLanguage;
  type: TemplateType;
  fileId: string;
}
