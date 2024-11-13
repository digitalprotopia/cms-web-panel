export interface IDynamicEntity {
  id: string,
  createdAt?: Date,
  updatedAt?: Date,
  deletedAt?: Date,
  isDeleted?: boolean,
  [key: string]: any,
}
