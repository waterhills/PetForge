/**
 * Alipay Service
 * Integrates with Alipay API using the official alipay-sdk
 * Handles payment creation, callback verification, and queries
 */

import * as AlipaySdk from "alipay-sdk";
import { createLogger } from '../utils/logger.js';
const logger = createLogger('alipayService');
// Note: AlipayFormData import disabled

let alipayInstance = null;

function initAlipay() {
  if (alipayInstance) {
    return alipayInstance;
  }

  const appId = process.env.ALIPAY_APPID;
  const privateKey = process.env.ALIPAY_PRIVATE_KEY;
  const alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY;

  if (!appId || !privateKey || !alipayPublicKey) {
    throw new Error('Missing required Alipay configuration');
  }

  alipayInstance = new AlipaySdk.AlipaySdk({
    appId,
    privateKey,
    alipayPublicKey,
    charset: 'utf-8',
    version: '1.0',
    signType: 'RSA2',
    gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
  });

  return alipayInstance;
}

export async function createPagePayOrder(orderData) {
  try {
    const alipay = initAlipay();
    const { transactionId, amount, description, returnUrl, notifyUrl } = orderData;

    const formData = new AlipayFormData();
    formData.setMethod('get');
    
    formData.addField('returnUrl', returnUrl || process.env.ALIPAY_RETURN_URL);
    formData.addField('notifyUrl', notifyUrl || process.env.ALIPAY_NOTIFY_URL);
    formData.addField('bizContent', {
      outTradeNo: transactionId,
      productCode: 'FAST_INSTANT_TRADE_PAY',
      totalAmount: amount.toFixed(2),
      subject: description || 'PetForge Order Payment',
    });

    const result = await alipay.exec('alipay.trade.page.pay', {}, { formData });

    return {
      success: true,
      paymentUrl: result,
      transactionId,
    };
  } catch (error) {
    logger.error('Alipay create order error:', error);
    throw new Error('Failed to create Alipay order: ' + error.message);
  }
}

export async function createWapPayOrder(orderData) {
  try {
    const alipay = initAlipay();
    const { transactionId, amount, description, returnUrl, notifyUrl } = orderData;

    const formData = new AlipayFormData();
    formData.setMethod('get');
    
    formData.addField('returnUrl', returnUrl || process.env.ALIPAY_RETURN_URL);
    formData.addField('notifyUrl', notifyUrl || process.env.ALIPAY_NOTIFY_URL);
    formData.addField('bizContent', {
      outTradeNo: transactionId,
      productCode: 'QUICK_WAP_WAY',
      totalAmount: amount.toFixed(2),
      subject: description || 'PetForge Order Payment',
    });

    const result = await alipay.exec('alipay.trade.wap.pay', {}, { formData });

    return {
      success: true,
      paymentUrl: result,
      transactionId,
    };
  } catch (error) {
    logger.error('Alipay WAP create order error:', error);
    throw new Error('Failed to create Alipay WAP order: ' + error.message);
  }
}

export async function queryPayment(transactionId) {
  try {
    const alipay = initAlipay();

    const result = await alipay.exec('alipay.trade.query', {
      bizContent: {
        outTradeNo: transactionId,
      },
    });

    if (result.code === '10000') {
      return {
        success: true,
        tradeStatus: result.tradeStatus,
        providerTransactionId: result.tradeNo,
        amount: parseFloat(result.totalAmount),
      };
    } else {
      return {
        success: false,
        code: result.code,
        message: result.msg || result.subMsg,
      };
    }
  } catch (error) {
    logger.error('Alipay query error:', error);
    throw new Error('Failed to query Alipay: ' + error.message);
  }
}

export async function verifyCallback(params) {
  try {
    const alipay = initAlipay();

    const signVerified = alipay.checkNotifySign(params);

    if (!signVerified) {
      throw new Error('Invalid Alipay signature');
    }

    return {
      success: true,
      transactionId: params.out_trade_no,
      providerTransactionId: params.trade_no,
      amount: parseFloat(params.total_amount),
      tradeStatus: params.trade_status,
    };
  } catch (error) {
    logger.error('Alipay verify callback error:', error);
    throw new Error('Failed to verify Alipay callback: ' + error.message);
  }
}

export async function closeOrder(transactionId) {
  try {
    const alipay = initAlipay();

    const result = await alipay.exec('alipay.trade.close', {
      bizContent: {
        outTradeNo: transactionId,
      },
    });

    if (result.code === '10000' || result.code === '40004') {
      return true;
    } else {
      throw new Error(result.msg || result.subMsg);
    }
  } catch (error) {
    logger.error('Alipay close order error:', error);
    throw new Error('Failed to close Alipay order: ' + error.message);
  }
}

export async function createRefund(refundData) {
  try {
    const alipay = initAlipay();
    const { transactionId, refundId, amount, reason } = refundData;

    const result = await alipay.exec('alipay.trade.refund', {
      bizContent: {
        outTradeNo: transactionId,
        outRequestNo: refundId,
        refundAmount: amount.toFixed(2),
        refundReason: reason || 'User requested refund',
      },
    });

    if (result.code === '10000') {
      return {
        success: true,
        refundId: result.refundFee,
        message: 'Refund created successfully',
      };
    } else {
      throw new Error(result.msg || result.subMsg);
    }
  } catch (error) {
    logger.error('Alipay refund error:', error);
    throw new Error('Failed to create Alipay refund: ' + error.message);
  }
}

export function getConfigurationStatus() {
  const required = [
    'ALIPAY_APPID',
    'ALIPAY_PRIVATE_KEY',
    'ALIPAY_PUBLIC_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  return {
    configured: missing.length === 0,
    missing,
  };
}

export default {
  createPagePayOrder,
  createWapPayOrder,
  queryPayment,
  verifyCallback,
  closeOrder,
  createRefund,
  getConfigurationStatus,
};
