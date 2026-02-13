/**
 * Unified Payment Service
 * 
 * Provides a unified interface for different payment providers (WeChat Pay, Alipay)
 * Handles payment creation, verification, and status management
 */

import prisma from '../config/database.js';
import wechatPayService from './wechatPayService.js';
import alipayService from './alipayService.js';
import { handlePaymentSuccess, handlePaymentFailure } from '../utils/orderStateMachine.js';

const PAYMENT_METHOD = {
  WECHAT: 'wechat',
  ALIPAY: 'alipay',
  CARD: 'card',
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export async function createPayment(orderId, transactionId, paymentMethod, amount, description, options = {}) {
  try {
    if (!Object.values(PAYMENT_METHOD).includes(paymentMethod)) {
      throw new Error('Invalid payment method: ' + paymentMethod);
    }

    const payment = await prisma.payment.create({
      data: {
        orderId,
        transactionId,
        amount,
        paymentMethod,
        status: PAYMENT_STATUS.PENDING,
        metadata: JSON.stringify(options),
      },
    });

    let result;
    switch (paymentMethod) {
      case PAYMENT_METHOD.WECHAT:
        result = await wechatPayService.createNativePayOrder({
          orderId,
          transactionId,
          amount,
          description,
          notifyUrl: options.notifyUrl,
        });
        break;

      case PAYMENT_METHOD.ALIPAY:
        result = await alipayService.createPagePayOrder({
          orderId,
          transactionId,
          amount,
          description,
          returnUrl: options.returnUrl,
          notifyUrl: options.notifyUrl,
        });
        break;

      default:
        throw new Error('Unsupported payment method: ' + paymentMethod);
    }

    return {
      success: true,
      paymentId: payment.id,
      transactionId: payment.transactionId,
      ...result,
    };
  } catch (error) {
    console.error('Create payment error:', error);
    throw error;
  }
}

export async function queryPaymentStatus(transactionId) {
  const payment = await prisma.payment.findUnique({
    where: { transactionId },
    include: { order: true },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status === PAYMENT_STATUS.SUCCESS) {
    return {
      success: true,
      status: payment.status,
      amount: payment.amount,
    };
  }

  let result;
  switch (payment.paymentMethod) {
    case PAYMENT_METHOD.WECHAT:
      result = await wechatPayService.queryPayment(transactionId);
      break;
    case PAYMENT_METHOD.ALIPAY:
      result = await alipayService.queryPayment(transactionId);
      break;
    default:
      throw new Error('Unsupported payment method');
  }

  if (result.success) {
    const isPaid = result.tradeState === 'SUCCESS' || result.tradeStatus === 'TRADE_SUCCESS';
    if (isPaid && payment.status !== PAYMENT_STATUS.SUCCESS) {
      await processSuccessfulPayment(payment.id, result.providerTransactionId);
    }
  }

  return {
    success: result.success,
    status: payment.status,
    amount: payment.amount,
  };
}

async function processSuccessfulPayment(paymentId, providerTransactionId) {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PAYMENT_STATUS.SUCCESS,
        providerTransactionId,
        paidAt: new Date(),
        notifyReceived: true,
      },
    });

    await handlePaymentSuccess(tx, payment.orderId);

    const pointsEarned = Math.floor(payment.amount);
    if (pointsEarned > 0) {
      const user = await tx.user.findUnique({
        where: { id: payment.order.userId },
        select: { credits: true },
      });

      const newBalance = user.credits + pointsEarned;

      await tx.user.update({
        where: { id: payment.order.userId },
        data: { credits: newBalance },
      });

      await tx.pointTransaction.create({
        data: {
          userId: payment.order.userId,
          type: 'earn',
          amount: pointsEarned,
          balance: newBalance,
          description: 'Points earned from order ' + payment.order.orderNumber,
          orderId: payment.orderId,
        },
      });
    }
  });
}

export async function processPaymentCallback(paymentMethod, headers, body) {
  let callbackData;
  switch (paymentMethod) {
    case PAYMENT_METHOD.WECHAT:
      callbackData = await wechatPayService.verifyCallback(headers, body);
      break;
    case PAYMENT_METHOD.ALIPAY:
      callbackData = await alipayService.verifyCallback(body);
      break;
    default:
      throw new Error('Unsupported payment method');
  }

  const { transactionId, providerTransactionId } = callbackData;

  const existingPayment = await prisma.payment.findUnique({
    where: { transactionId },
    include: { order: true },
  });

  if (!existingPayment) {
    throw new Error('Payment not found');
  }

  if (existingPayment.notifyReceived) {
    return {
      success: true,
      message: 'Callback already processed',
      transactionId,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: existingPayment.id },
      data: {
        status: PAYMENT_STATUS.SUCCESS,
        providerTransactionId,
        paidAt: new Date(),
        notifyReceived: true,
      },
    });

    await handlePaymentSuccess(tx, existingPayment.orderId);
  });

  return {
    success: true,
    message: 'Payment processed successfully',
    transactionId,
  };
}

export async function processFailedPayment(transactionId, reason) {
  const payment = await prisma.payment.findUnique({
    where: { transactionId },
    include: { order: true },
  });

  if (!payment) {
    throw new Error('Payment not found');
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PAYMENT_STATUS.FAILED,
        failureReason: reason,
        retryCount: { increment: 1 },
      },
    });

    await handlePaymentFailure(tx, payment.orderId, reason);
  });
}

export function getPaymentConfigStatus() {
  return {
    wechat: wechatPayService.getConfigurationStatus(),
    alipay: alipayService.getConfigurationStatus(),
  };
}

export { PAYMENT_METHOD, PAYMENT_STATUS };

export default {
  createPayment,
  queryPaymentStatus,
  processPaymentCallback,
  processFailedPayment,
  getPaymentConfigStatus,
};
