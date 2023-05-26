import { AppModuleType, AppModuleResponseEnum } from '@/types/app';
import { linkModule2App } from '@/constants/app';
import { ModuleEnum, modules } from '@/constants/module';
import { POST } from '../api/request';
import { ChatItemSimpleType } from '@/types/chat';
import { ModelSchema } from '@/types/mongoSchema';
import { streamFetch } from '../api/fetch';

export const dispatchApp = async ({
  app,
  prompts,
  userId
}: {
  app: ModelSchema;
  prompts: ChatItemSimpleType[];
  userId: string;
}) => {
  const appChain = linkModule2App({
    temperature: 0,
    maxToken: 4000,
    systemPrompt: '',
    model: ModuleEnum.gpt35,
    useSearch: true,
    distance: 0.2,
    kbIds: app.chat.relatedKbs
  });

  const response = await new Promise((resolve, reject) => {
    // 给一个初始化值
    appChain[0].output.prompts.value = prompts;
    const clientResponse: Record<string, any> = {};
    let success = 1;

    // 执行 module 内容
    async function runModule(appItem: AppModuleType) {
      if (appItem.finish) return;

      const moduleItem = modules.find((item) => item._id === appItem.moduleId);

      if (!moduleItem) return;

      try {
        //   // 执行
        const { responseText } = await streamFetch({
          url: moduleItem.url,
          data: appItem.input,
          userId
        });

        const { code = 200, ...responseJson }: Record<string, any> = (() => {
          if (appItem.responseType === AppModuleResponseEnum.json) {
            return JSON.parse(responseText);
          }
          return { responseText };
        })();

        // 更新自身的输出
        for (const key in appItem.output) {
          appItem.output[key].value = responseJson[key];

          // 记录需要反馈给客户端的内容
          const clientResKey = appItem.output[key].responseClient?.key;
          if (clientResKey) {
            clientResponse[clientResKey] = appItem.output[key].value;
          }
        }
        console.log(responseText);

        // 201 代表请求成果，但是终止后续内容
        if (code === 201) {
          return resolve(clientResponse);
        }

        // 继续更新另一个输入
        updateAppInputByOutput(appItem.output);
      } catch (error) {
        return reject(error);
      }

      // 结束标志
      appItem.finish = true;
      success++;
      if (success === appChain.length) {
        resolve(clientResponse);
      }
    }

    // 得到一组输出，更新其他 module 的输入
    async function updateAppInputByOutput(output: AppModuleType['output']) {
      try {
        for await (const item of Object.values(output)) {
          if (!item.value) continue;
          // 遍历连接的所有 module
          for await (const outModuleItem of item.outModules) {
            // 找 module 对应的 app
            const appItem = appChain.find((appItem) => appItem._id === outModuleItem.id);
            if (!appItem) break;

            // 更新对应 app里的 input 值
            appItem.input[outModuleItem.key] = item.value;

            // 判断是否搜索输入都齐全
            const isWait = Object.values(appItem.input).find((item) => item === 'undefined');
            if (isWait) break;

            // 输入齐全，执行 module
            await runModule(appItem);
          }
        }
      } catch (error) {
        reject(error);
      }
    }

    updateAppInputByOutput(appChain[0].output);
  });

  return response;
};
