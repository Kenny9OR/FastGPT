interface StreamFetchProps {
  url: string;
  data: any;
  userId: string;

  onMessage?: (text: string) => void;
}
export const streamFetch = ({ url, data, userId, onMessage }: StreamFetchProps) =>
  new Promise<{ responseText: string }>(async (resolve, reject) => {
    try {
      const res = await fetch(`http://localhost:3000/api${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          rootKey: process.env.ROOT_KEY || '',
          userid: userId
        },
        body: JSON.stringify(data)
        // signal: abortSignal.signal
      });
      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();

      let responseText = '';

      const read = async () => {
        try {
          const { done, value } = await reader?.read();
          if (done) {
            if (res.status === 200) {
              resolve({ responseText });
            } else {
              const parseError = JSON.parse(responseText);
              reject(parseError?.message || '请求异常');
            }

            return;
          }
          const text = decoder.decode(value);
          responseText += text;
          typeof onMessage === 'function' && onMessage(text);
          read();
        } catch (err: any) {
          if (err?.message === 'The user aborted a request.') {
            return resolve({ responseText });
          }
          reject(typeof err === 'string' ? err : err?.message || '请求异常');
        }
      };
      read();
    } catch (err: any) {
      console.log(err, '====');
      reject(typeof err === 'string' ? err : err?.message || '请求异常');
    }
  });
