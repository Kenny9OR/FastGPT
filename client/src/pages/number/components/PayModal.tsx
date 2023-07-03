import React, { useState, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  Box,
  Grid
} from '@chakra-ui/react';
import { getPayCode, checkPayResult, putUserInfo } from '@/api/user';
import { useToast } from '@/hooks/useToast';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { getErrText } from '@/utils/tools';
import { User } from '@/service/models/user';
import Markdown from '@/components/Markdown';
import { useUserStore } from '@/store/user';
import { useForm } from 'react-hook-form';
import { UserType, UserUpdateParams } from '@/types/user';
import { authOpenAiKey } from '@/utils/plugin/openai';

const PayModal = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [inputVal, setInputVal] = useState<number | ''>('');
  const [inputMonth, setInputMonth] = useState<string | ''>('');
  const [loading, setLoading] = useState(false);
  const [payId, setPayId] = useState('');
  const { userInfo, updateUserInfo, initUserInfo, setUserInfo } = useUserStore();
  const { register, handleSubmit, reset } = useForm<UserUpdateParams>({
    defaultValues: userInfo as UserType
  });

  const handleClickPay = useCallback(async () => {
    if (!inputVal || inputVal <= 0 || isNaN(+inputVal)) return;
    setLoading(true);
    try {
      // 获取支付二维码
      const res = await getPayCode(inputVal);
      new QRCode(document.getElementById('payQRCode'), {
        text: res.codeUrl,
        width: 128,
        height: 128,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
      setPayId(res.payId);
    } catch (err) {
      toast({
        title: getErrText(err),
        status: 'error'
      });
    }
    setLoading(false);
  }, [inputVal, toast]);

  // const clickPay = useCallback(async () => {
  //   if (!inputMonth || isNaN(+inputMonth)) return;
  //   setLoading(true);
  //   try {
  //     useQuery([123]);
  //   } catch (err) {
  //     toast({
  //       title: getErrText(err),
  //       status: 'error'
  //     });
  //   }
  //   setLoading(false);
  // }, [inputMonth, toast]);

  function clickPay() {
    const expireDate = new Date(userInfo?.expireDate || '');
    const currentDate = new Date();
    let newExpireDate: Date;

    if (expireDate < currentDate) {
      newExpireDate = currentDate;
      switch (inputMonth) {
        case '一个月':
          newExpireDate.setMonth(newExpireDate.getMonth() + 1);
          break;
        case '三个月':
          newExpireDate.setMonth(newExpireDate.getMonth() + 3);
          break;
        case '半年':
          newExpireDate.setMonth(newExpireDate.getMonth() + 7);
          break;
        case '一年':
          newExpireDate.setFullYear(newExpireDate.getFullYear() + 1);
          break;
        default:
          // 处理未知的 month 值
          toast({
            title: getErrText('请输入正确的月份'),
            status: 'error'
          });
          break;
      }
    } else {
      switch (inputMonth) {
        case '一个月':
          expireDate.setMonth(expireDate.getMonth() + 1);
          break;
        case '三个月':
          expireDate.setMonth(expireDate.getMonth() + 3);
          break;
        case '半年':
          expireDate.setMonth(expireDate.getMonth() + 7);
          break;
        case '一年':
          expireDate.setFullYear(expireDate.getFullYear() + 1);
          break;
        default:
          // 处理未知的 month 值
          toast({
            title: getErrText('请输入正确的月份'),
            status: 'error'
          });
          break;
      }
      newExpireDate = expireDate;
    }
    return newExpireDate;
  }

  const onclickSave = useCallback(
    async (data: UserUpdateParams) => {
      setLoading(true);
      const expireDate = clickPay();
      console.log(expireDate.getDate());
      try {
        await putUserInfo({
          openaiKey: data.openaiKey,
          balance: data.balance,
          expireDate: expireDate
        });
        console.log(data);
        updateUserInfo({
          openaiKey: data.openaiKey,
          balance: data.balance,
          expireDate: expireDate
        });
        console.log(data);
        reset(data);
        console.log(data);
        toast({
          title: '续费成功',
          status: 'success'
        });
      } catch (error) {
        toast({
          title: getErrText(error),
          status: 'error'
        });
      }
      setLoading(false);
    },
    [clickPay, reset, setLoading, toast, updateUserInfo]
  );

  useQuery(
    [0],
    () => {
      // return checkPayResult(payId);
      return 0;
    },
    {
      enabled: !!payId,
      refetchInterval: 3000,
      onSuccess(res) {
        if (!res) return;
        toast({
          title: '充值成功',
          status: 'success'
        });
        router.reload();
      }
    }
  );

  return (
    <>
      <Modal
        isOpen={true}
        onClose={() => {
          if (payId) return;
          onClose();
        }}
      >
        <ModalOverlay />
        <ModalContent minW={'auto'}>
          <ModalHeader>充值</ModalHeader>
          {!payId && <ModalCloseButton />}

          <ModalBody py={0}>
            {!payId && (
              <>
                <Grid gridTemplateColumns={'repeat(4,1fr)'} gridGap={5} mb={4}>
                  {[10, 20, 50, 100].map((item) => (
                    <Button
                      key={item}
                      variant={item === inputVal ? 'solid' : 'outline'}
                      onClick={() => setInputVal(item)}
                    >
                      {item}元
                    </Button>
                  ))}
                </Grid>
                <Grid gridTemplateColumns={'repeat(4,1fr)'} gridGap={5} mb={4}>
                  {['一个月', '三个月', '半年', '一年'].map((item) => (
                    <Button
                      key={item}
                      variant={item === inputVal ? 'solid' : 'outline'}
                      onClick={() => setInputMonth(item)}
                    >
                      {item}
                    </Button>
                  ))}
                </Grid>
                <Box mb={4}>
                  <Input
                    value={inputVal}
                    type={'number'}
                    step={1}
                    placeholder={'其他金额，请取整数'}
                    onChange={(e) => {
                      setInputVal(Math.floor(+e.target.value));
                    }}
                  ></Input>
                  <Input
                    value={inputMonth}
                    type={'string'}
                    step={1}
                    placeholder={'月份'}
                    onChange={(e) => {
                      setInputMonth(e.target.value);
                    }}
                  ></Input>
                </Box>
                <Markdown
                  source={`
| 计费项 | 价格: 元/ 1K tokens(包含上下文)|
| --- | --- |
| 知识库 - 索引 | 0.001 |
| chatgpt - 对话 | 0.022 |
| chatgpt16K - 对话 | 0.025 |
| gpt4 - 对话 | 0.5 |
| 文件拆分 | 0.025 |`}
                />
              </>
            )}
            {/* 付费二维码 */}
            <Box textAlign={'center'}>
              {payId && <Box mb={3}>请微信扫码支付: {inputVal}元，请勿关闭页面</Box>}
              <Box id={'payQRCode'} display={'inline-block'}></Box>
            </Box>
          </ModalBody>

          <ModalFooter>
            {!payId && (
              <>
                <Button variant={'base'} onClick={onClose}>
                  取消
                </Button>
                <Button
                  ml={3}
                  isLoading={loading}
                  isDisabled={!inputVal || inputVal === 0}
                  onClick={handleClickPay}
                >
                  获取充值二维码
                </Button>
                <Button
                  ml={3}
                  isLoading={loading}
                  isDisabled={!inputMonth}
                  onClick={handleSubmit(onclickSave)}
                >
                  确认充值
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default PayModal;
