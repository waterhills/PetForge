/**
 * WeChat Pay Service
 * Integrates with WeChat Pay API using the official wechatpay-node-v3 SDK
 */

import Wechatpay from 'wechatpay-node-v3';
import fs from 'fs';
import { createLogger } from '../utils/logger.js';
const logger = createLogger('wechatPayService');

let wechatpayInstance = null;

function initWeChatPay() {
  if (wechatpayInstance) {
    return wechatpayInstance;
  }

  const appid = process.env.WECHAT_PAY_APPID;
  const mchid = process.env.WECHAT_PAY_MCHID;
  const serial_no = process.env.WECHAT_PAY_CERT_SERIAL_NO;
  const private_key = fs.readFileSync(process.env.WECHAT_PAY_PRIVATE_KEY_PATH).toString();
  const apiv3_private_key = process.env.WECHAT_PAY_API_V3_KEY;

  if (!appid || !mchid || !private_key || !apiv3_private_key) {
    throw new Error('Missing required WeChat Pay configuration');
  }

  wechatpayInstance = new wechatpay(
    { appid, mchid, serial_no, private_key, apiv3_private_key },
    {}
  );

  return wechatpayInstance;
}

export async function createNativePayOrder(orderData) {
  try {
    const wechatpay = initWeChatPay();
    const { transactionId, amount, description, notifyUrl } = orderData;

    const params = {
      appid: process.env.WECHAT_PAY_APPID,
      mchid: process.env.WECHAT_PAY_MCHID,
      description: description || 'PetForge Order Payment',
      out_trade_no: transactionId,
      notify_url: notifyUrl || process.env.WECHAT_PAY_NOTIFY_URL,
      amount: {
        total: Math.round(amount * 100),
        currency: 'CNY',
      },
    };

    const result = await wechatpay.transactions_native(params);
    
    return {
      success: true,
      codeUrl: result.code_url,
      transactionId,
    };
  } catch (error) {
    logger.error('WeChat Pay create order error:', error);
    throw new Error('Failed to create WeChat Pay order: ' + error.message);
  }
}

export async function queryPayment(transactionId) {
  try {
    const wechatpay = initWeChatPay();
    const mchid = process.env.WECHAT_PAY_MCHID;

    const result = await wechatpay.query({
      out_trade_no: transactionId,
      mchid,
    });

    return {
      success: true,
      tradeState: result.trade_state,
      providerTransactionId: result.transaction_id,
      amount: result.amount?.total ? result.amount.total / 100 : 0,
    };
  } catch (error) {
    logger.error('WeChat Pay query error:', error);
    throw new Error('Failed to query WeChat Pay: ' + error.message);
  }
}

export async function verifyCallback(headers, body) {
  try {
    const wechatpay = initWeChatPay();

    const serial = headers['wechatpay-serial'];
    const signature = headers['wechatpay-signature'];

    if (!serial || !signature) {
      throw new Error('Missing required WeChat Pay callback headers');
    }

    const callbackData = JSON.parse(body);
    const decrypted = wechatpay.decipher_gcm(
      callbackData.resource.associated_data,
      callbackData.resource.nonce,
      callbackData.resource.ciphertext
    );

    const decryptedData = JSON.parse(decrypted);

    return {
      success: true,
      transactionId: decryptedData.out_trade_no,
      providerTransactionId: decryptedData.transaction_id,
      amount: decryptedData.amount?.total ? decryptedData.amount.total / 100 : 0,
    };
  } catch (error) {
    logger.error('WeChat Pay verify callback error:', error);
    throw new Error('Failed to verify WeChat Pay callback: ' + error.message);
  }
}

export function getConfigurationStatus() {
  const required = [
    'WECHAT_PAY_APPID',
    'WECHAT_PAY_MCHID',
    'WECHAT_PAY_API_V3_KEY',
    'WECHAT_PAY_PRIVATE_KEY_PATH',
  ];

  const missing = required.filter(key => !process.env[key]);

  return {
    configured: missing.length === 0,
    missing,
  };
}

export default {
  createNativePayOrder,
  queryPayment,
  verifyCallback,
  getConfigurationStatus,
};
