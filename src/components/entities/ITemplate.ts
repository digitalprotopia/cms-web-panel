import { IEntity } from './IEntity';

export interface ITemplateFormData {
  name: string;
  title: string;
  templateGroupId: string | null | undefined;
  html: string;
  css: string;
  language: TemplateLanguage;
}

export interface ITemplate extends IEntity, ITemplateFormData {
  isMultiple: boolean;
}

export enum TemplateLanguage {
  SIMPLE = 'simple',
  REACT = 'react',
}
