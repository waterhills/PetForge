import express from 'express';
import paymentService from '../services/paymentService.js';
import { verifyPaymentIp } from '../middleware/verifyPayment.js';

const router = express.Router();

// POST /api/payments/alipay/notify - Alipay payment callback
router.post('/notify', verifyPaymentIp('alipay'), async (req, res) => {
  try {
    const result = await paymentService.processPaymentCallback(
      'alipay',
      req.headers,
      req.body
    );

    // Alipay expects 'success' response
    res.send('success');
  } catch (error) {
    console.error('Alipay callback error:', error);
    
    // Return error response to Alipay
    res.send('fail');
  }
});

export default router;
