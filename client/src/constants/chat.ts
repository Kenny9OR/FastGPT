export enum sseResponseEventEnum {
  error = 'error',
  answer = 'answer',
  chatResponse = 'chatResponse'
}

export enum ChatRoleEnum {
  System = 'System',
  Human = 'Human',
  AI = 'AI'
}

export const ChatRoleMap = {
  [ChatRoleEnum.System]: {
    name: '系统提示词'
  },
  [ChatRoleEnum.Human]: {
    name: '用户'
  },
  [ChatRoleEnum.AI]: {
    name: 'AI'
  }
};

export const HUMAN_ICON = `http://kkgpt.co/icon/human.png`;
export const LOGO_ICON = `http://kkgpt.co/icon/WechatIMG1833.png`;
