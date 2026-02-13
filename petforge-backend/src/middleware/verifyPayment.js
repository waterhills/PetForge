import ip from 'ip';

// WeChat Pay IP whitelist (production)
const WECHAT_PAY_IPS = [
  '101.226.103.0/24',
  '101.226.62.0/24',
  '101.226.33.0/24',
  '101.201.196.0/24',
  '101.201.177.0/24',
  '101.201.55.0/24',
];

// Alipay IP whitelist (production)
const ALIPAY_IPS = [
  '110.75.143.0/24',
  '110.75.144.0/24',
  '110.75.145.0/24',
  '110.75.146.0/24',
];

function isIpInWhitelist(clientIp, whitelist) {
  return whitelist.some(cidr => {
    try {
      return ip.cidrSubnet(cidr).contains(clientIp);
    } catch (error) {
      return false;
    }
  });
}

export function verifyPaymentIp(paymentMethod) {
  return (req, res, next) => {
    const clientIp = req.ip || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress ||
                    (req.headers['x-forwarded-for'] || '').split(',')[0].trim();

    let whitelist;
    switch (paymentMethod) {
      case 'wechat':
        whitelist = WECHAT_PAY_IPS;
        break;
      case 'alipay':
        whitelist = ALIPAY_IPS;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid payment method',
        });
    }

    // Skip IP check in development/test mode
    if (process.env.NODE_ENV !== 'production') {
      console.log('Skipping IP whitelist check in development mode');
      return next();
    }

    if (!isIpInWhitelist(clientIp, whitelist)) {
      console.warn('Unauthorized payment callback IP:', clientIp);
      return res.status(403).json({
        success: false,
        error: 'Unauthorized request',
      });
    }

    next();
  };
}

export default verifyPaymentIp;
