import type { BillSchema } from './mongoSchema';
export interface UserType {
  _id: string;
  username: string;
  avatar: string;
  openaiKey: string;
  balance: number;
  promotion: {
    rate: number;
  };
  expireDate: Date;
}

export interface UserUpdateParams {
  balance?: number;
  avatar?: string;
  openaiKey?: string;
  expireDate?: Date;
}

export interface UserBillType {
  id: string;
  time: Date;
  modelName: BillSchema['modelName'];
  type: BillSchema['type'];
  textLen: number;
  tokenLen: number;
  price: number;
}
