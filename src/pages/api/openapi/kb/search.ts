import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@/service/response';
import { authUser } from '@/service/utils/auth';
import { PgClient } from '@/service/pg';
import { withNextCors } from '@/service/utils/tools';
import type { ChatItemSimpleType } from '@/types/chat';
import { ChatRoleEnum } from '@/constants/chat';
import { openaiEmbedding } from '../plugin/openaiEmbedding';
import { ModelDataStatusEnum } from '@/constants/model';
import { modelToolMap } from '@/utils/plugin';

export type QuoteItemType = { id: string; q: string; a: string; isEdit: boolean };
type Props = {
  prompts: ChatItemSimpleType[];
  distance: number;
  kbIds: string[];
  noResultHint: string;
  maxToken: number;
};
type Response = {
  code: 200 | 201;
  rawSearch: QuoteItemType[];
  searchPrompts: {
    obj: ChatRoleEnum;
    value: string;
  }[];
};

export default withNextCors(async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const { userId } = await authUser({ req });

    if (!userId) {
      throw new Error('userId is empty');
    }

    const {
      prompts = [],
      distance = 0.2,
      kbIds = [],
      maxToken = 2000,
      noResultHint = ''
    } = req.body as Props;

    if (
      !Array.isArray(prompts) ||
      prompts.length === 0 ||
      !Array.isArray(kbIds) ||
      kbIds.length === 0
    ) {
      throw new Error('params is error');
    }

    const result = await appKbSearch({
      userId,
      prompts,
      distance,
      kbIds,
      maxToken,
      noResultHint
    });

    res.end(JSON.stringify(result));
  } catch (err) {
    jsonRes(res, {
      code: 500,
      error: err
    });
  }
});

export async function appKbSearch({
  kbIds,
  userId,
  prompts,
  distance,
  noResultHint,
  maxToken
}: Props & { userId: string }): Promise<Response> {
  // search two times.
  const userPrompts = prompts.filter((item) => item.obj === 'Human');

  const input: string[] = [
    userPrompts[userPrompts.length - 1].value,
    userPrompts[userPrompts.length - 2]?.value
  ].filter((item) => item);

  // get vector
  const promptVectors = await openaiEmbedding({
    userId,
    input
  });

  // search kb
  const searchRes = await Promise.all(
    promptVectors.map((promptVector) =>
      PgClient.select<QuoteItemType>('modelData', {
        fields: ['id', 'q', 'a'],
        where: [
          ['status', ModelDataStatusEnum.ready],
          'AND',
          `kb_id IN (${kbIds.map((item) => `'${item}'`).join(',')})`,
          'AND',
          `vector <=> '[${promptVector}]' < ${distance}`
        ],
        order: [{ field: 'vector', mode: `<=> '[${promptVector}]'` }],
        limit: promptVectors.length === 1 ? 15 : 10
      }).then((res) => res.rows)
    )
  );

  // filter same search result
  const idSet = new Set<string>();
  const filterSearch = searchRes.map((search) =>
    search.filter((item) => {
      if (idSet.has(item.id)) {
        return false;
      }
      idSet.add(item.id);
      return true;
    })
  );

  // slice search result by rate.
  const sliceRateMap: Record<number, number[]> = {
    1: [1],
    2: [0.7, 0.3]
  };
  const sliceRate = sliceRateMap[searchRes.length] || sliceRateMap[0];

  const sliceResult = sliceRate.map((rate, i) =>
    modelToolMap['gpt-3.5-turbo']
      .tokenSlice({
        maxToken: Math.round(maxToken * rate),
        messages: filterSearch[i].map((item) => ({
          obj: ChatRoleEnum.System,
          value: `${item.q}\n${item.a}`
        }))
      })
      .map((item) => item.value)
  );

  // slice filterSearch
  const sliceSearch = filterSearch.map((item, i) => item.slice(0, sliceResult[i].length)).flat();

  //  system prompt
  const systemPrompt = sliceResult.flat().join('\n').trim();

  /* 无匹配内容，回复固定词 */
  if (!systemPrompt && noResultHint) {
    return {
      code: 201,
      rawSearch: [],
      searchPrompts: [
        {
          obj: ChatRoleEnum.System,
          value: noResultHint
        }
      ]
    };
  }

  return {
    code: 200,
    rawSearch: sliceSearch,
    searchPrompts: [
      {
        obj: ChatRoleEnum.System,
        value: `知识库:${systemPrompt}`
      }
    ]
  };
}
