import { ChatRoleEnum } from '@/constants/chat';

export type PromptsType = {
  obj: `${ChatRoleEnum}`;
  value: string;
};

export enum valueType {
  text = 'text',
  num = 'num',
  prompts = 'prompts' // PromptsType 输入格式
}

/* app */
export type ModuleConfigType = {
  _id: string;
  name: string;
  intro: string;
  url: string;
  price: number;
  input: {
    type: `${valueType}`;
    key: string; // 指定 key 字段
    title: string;
    placeholder?: string;
    intro?: string;
    min?: number;
    max?: number;
    maxLen?: number;
    enum?: { label: number; value: number }[];
    required?: boolean;
    default?: string | number; // depend不生效
  }[];
  output: {
    // 输出字段和类型
    type: `${valueType}`;
    key: string; // key字段
    title: string;
    intro?: string;
  }[];
};

export enum AppModuleResponseEnum {
  'json' = 'json',
  'text' = 'text'
}
export type OutputItem = {
  outModules: {
    id: string;
    key: string;
  }[];
  value: any;
  responseClient?: {
    type: 'json' | 'stream';
    key: string;
  };
};
export type AppModuleType = {
  _id: string;
  moduleId: string;
  finish: boolean;
  responseType: `${AppModuleResponseEnum}`;
  input: Record<string, 'undefined' | any>; // 'undefined' 意味着等待填充
  output: Record<string, OutputItem>;
};
