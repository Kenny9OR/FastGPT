import type { ModuleConfigType } from '../types/app';

export enum ModuleEnum {
  gpt35 = 'gpt35',
  // gpt4 = 'gpt4',
  // openaiEmbedding = 'openaiEmbedding',
  kbSearch = 'kbSearch'
}

export const modules: ModuleConfigType[] = [
  {
    _id: ModuleEnum.gpt35,
    name: 'ChatGpt',
    intro: '基于 openai gpt35 接口',
    url: '/openapi/openai/gpt?model=gpt35',
    price: 0.025,
    input: [
      {
        type: 'prompts',
        key: 'prompts',
        title: '输入内容',
        required: true
      },
      {
        type: 'text',
        key: 'systemPrompt',
        title: '系统提示词',
        default: ''
      },
      {
        type: 'num',
        key: 'temperature',
        title: '温度值0~2',
        min: 0,
        max: 2,
        default: 0
      },
      {
        type: 'num',
        key: 'maxToken',
        title: '最大token 100~4000',
        min: 100,
        max: 4000,
        default: 4000
      }
    ],
    output: [
      {
        type: 'text',
        key: 'responseText',
        title: '响应文本'
      }
    ]
  },
  {
    _id: ModuleEnum.kbSearch,
    name: '知识库搜索',
    intro: '使用向量进行知识库搜索',
    url: '/openapi/kb/search',
    price: 0,
    input: [
      {
        type: 'prompts',
        key: 'prompts',
        title: '输入内容',
        intro: '只有 obj=Human 的有效，会去最新的 2 个问题进行搜索。',
        required: true
      },
      {
        type: 'num',
        key: 'distance',
        title: '相似距离',
        intro: '越小越相近，0.1 ~ 1',
        min: 0.1,
        max: 1,
        default: 0.2
      }
    ],
    output: [
      {
        type: 'prompts',
        key: 'searchPrompts',
        title: '搜索到的内容'
      }
    ]
  }
];
