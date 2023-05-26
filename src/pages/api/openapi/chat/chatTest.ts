import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/service/mongo';
import { authUser, authModel } from '@/service/utils/auth';
import { modelServiceToolMap } from '@/service/utils/chat';
import { ChatItemSimpleType } from '@/types/chat';
import { jsonRes } from '@/service/response';
import { ChatModelMap, ModelVectorSearchModeMap } from '@/constants/model';
import { pushChatBill } from '@/service/events/pushBill';
import { resStreamResponse } from '@/service/utils/chat';
import { appKbSearch } from '../kb/appKbSearch';
import { ChatRoleEnum, QUOTE_LEN_HEADER, GUIDE_PROMPT_HEADER } from '@/constants/chat';
import { BillTypeEnum } from '@/constants/user';
import { sensitiveCheck } from '@/service/api/text';
import { NEW_CHATID_HEADER } from '@/constants/chat';
import { saveChat } from '../../chat/saveChat';
import { Types } from 'mongoose';
import { dispatchApp } from '@/service/events/dispatch';

/* 发送提示词 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.on('close', () => {
    res.end();
  });
  res.on('error', () => {
    console.log('error: ', 'request error');
    res.end();
  });

  try {
    const { chatId, prompts, modelId } = req.body as {
      prompts: ChatItemSimpleType[];
      modelId: string;
      chatId?: string;
    };

    if (!modelId) {
      throw new Error('缺少参数');
    }

    await connectToDatabase();

    /* 凭证校验 */
    const { userId } = await authUser({ req });

    const { model } = await authModel({
      userId,
      modelId
    });

    const response = await dispatchApp({
      prompts,
      app: model,
      userId
    });

    jsonRes(res, {
      data: response
    });
  } catch (err: any) {
    res.status(500);
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
}
