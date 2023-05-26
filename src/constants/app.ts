import { AppModuleType, AppModuleResponseEnum } from '@/types/app';
import { ModuleEnum } from './module';

const promptsInputModule = {
  _id: 'userInput',
  moduleId: '',
  finish: true,
  responseType: AppModuleResponseEnum.json,
  input: {},
  output: {
    prompts: {
      outModules: [
        {
          id: 'search',
          key: 'prompts'
        },
        {
          id: 'chat',
          key: 'prompts'
        }
      ],
      value: 'undefined'
    }
  }
};

const searchModule = ({ distance, kbIds }: { distance: number; kbIds: string[] }) => {
  if (!distance || !Array.isArray(kbIds) || kbIds.length === 0) return [];
  return [
    {
      _id: 'search',
      moduleId: ModuleEnum.kbSearch,
      finish: false,
      responseType: AppModuleResponseEnum.json,
      input: {
        distance,
        kbIds,
        prompts: 'undefined'
      },
      output: {
        searchPrompts: {
          outModules: [
            {
              id: 'chat',
              key: 'searchPrompts'
            }
          ],
          value: 'undefined'
        }
      }
    }
  ];
};

const gptChatModule = ({
  temperature,
  maxToken,
  systemPrompt,
  model,
  useSearch
}: {
  temperature: number;
  maxToken: number;
  systemPrompt: string;
  model: ModuleEnum.gpt35;
  useSearch: boolean;
}): AppModuleType => {
  return {
    _id: 'chat',
    moduleId: ModuleEnum.gpt35,
    finish: false,
    responseType: AppModuleResponseEnum.text,
    input: {
      maxToken,
      temperature,
      systemPrompt,
      searchPrompts: useSearch ? 'undefined' : [],
      prompts: 'undefined'
    },
    output: {
      responseText: {
        outModules: [],
        value: 'undefined',
        responseClient: {
          type: 'json',
          key: 'responseText'
        }
      }
    }
  };
};

export const linkModule2App = ({
  temperature,
  maxToken,
  systemPrompt,
  model,
  useSearch,
  distance,
  kbIds
}: {
  temperature: number;
  maxToken: number;
  systemPrompt: string;
  model: ModuleEnum.gpt35;
  useSearch: boolean;
  distance: number;
  kbIds: string[];
}): AppModuleType[] => {
  return [
    promptsInputModule,
    ...searchModule({ distance, kbIds }),
    gptChatModule({
      temperature,
      maxToken,
      systemPrompt,
      model,
      useSearch
    })
  ];
};
