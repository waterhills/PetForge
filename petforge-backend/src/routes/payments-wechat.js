import express from 'express';
import paymentService from '../services/paymentService.js';
import { verifyPaymentIp } from '../middleware/verifyPayment.js';

const router = express.Router();

// POST /api/payments/wechat/notify - WeChat Pay payment callback
router.post('/notify', verifyPaymentIp('wechat'), async (req, res) => {
  try {
    const result = await paymentService.processPaymentCallback(
      'wechat',
      req.headers,
      JSON.stringify(req.body)
    );

    // WeChat Pay expects success response
    res.json({
      code: 'SUCCESS',
      message: '成功',
    });
  } catch (error) {
    console.error('WeChat Pay callback error:', error);
    
    // Return error response to WeChat Pay
    res.json({
      code: 'FAIL',
      message: error.message,
    });
  }
});

export default router;
