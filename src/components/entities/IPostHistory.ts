import { IEntity } from "./IEntity";

export interface IPostHistory extends IEntity {
    postId: string;
    title: string;
    blockContent: any;
    preview: string;
}
