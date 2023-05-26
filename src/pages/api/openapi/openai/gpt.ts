import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { authUser } from '@/service/utils/auth';
import { PgClient } from '@/service/pg';
import { withNextCors } from '@/service/utils/tools';
import { ChatItemSimpleType } from '@/types/chat';
import { chatResponse } from '@/service/utils/chat/openai';

export default withNextCors(async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const { model } = req.query as {
      model: string;
    };
    const {
      temperature = 0.2,
      systemPrompt = '',
      searchPrompts = [],
      prompts = []
    } = req.body as {
      temperature: number;
      systemPrompt: string;
      searchPrompts: ChatItemSimpleType[];
      prompts: ChatItemSimpleType[];
    };

    const response = await chatResponse({
      model: 'gpt-3.5-turbo',
      apiKey: process.env.OPENAIKEY || '',
      temperature,
      messages: [
        ...searchPrompts,
        {
          obj: 'System',
          value: systemPrompt
        },
        ...prompts
      ],
      stream: false
    });

    jsonRes(res, {
      data: {
        responseText: response.responseText,
        totalToken: response.totalTokens
      }
    });
  } catch (err) {
    console.log(err);
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
});
