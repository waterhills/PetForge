# Payment System Setup Guide

This guide explains how to configure WeChat Pay and Alipay for the PetForge platform.

## Prerequisites

1. WeChat Pay Merchant Account
2. Alipay Open Platform Account
3. SSL Certificate (for production)

## WeChat Pay Setup

### 1. Obtain WeChat Pay Credentials

1. Log in to [WeChat Pay Merchant Platform](https://pay.weixin.qq.com/)
2. Navigate to: Account Center > API Security
3. Set API v3 Key (32 characters)
4. Download merchant certificate (apiclient_cert.pem, apiclient_key.pem)
5. Note your AppID and Merchant ID (MCHID)
6. Get certificate serial number from certificate details

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
WECHAT_PAY_APPID=wxXXXXXXXXXXXXXXXX
WECHAT_PAY_MCHID=1XXXXXXXXX
WECHAT_PAY_API_V3_KEY=your_32_char_api_key_here
WECHAT_PAY_PRIVATE_KEY_PATH=./certs/wechat/apiclient_key.pem
WECHAT_PAY_CERT_SERIAL_NO=your_cert_serial_no
WECHAT_PAY_NOTIFY_URL=https://yourdomain.com/api/payments/wechat/notify
```

### 3. Certificate Setup

Create directory structure:
```
petforge-backend/
└── certs/
    └── wechat/
        ├── apiclient_cert.pem
        ├── apiclient_key.pem
        └── wechatpay_pubkey.pem
```

Place downloaded certificates in the `certs/wechat/` directory.

### 4. Testing

Use WeChat Pay sandbox for testing:
- Sandbox URL: https://pay.weixin.qq.com/wiki/doc/apiv3/open/pay/chapter2_7_2.shtml
- Use test credentials provided by WeChat

## Alipay Setup

### 1. Obtain Alipay Credentials

1. Log in to [Alipay Open Platform](https://open.alipay.com/)
2. Create an application and get AppID
3. Generate RSA key pair:
   ```bash
   openssl genrsa -out app_private_key.pem 2048
   openssl rsa -in app_private_key.pem -pubout -out app_public_key.pem
   ```
4. Upload public key to Alipay platform
5. Download Alipay public key
6. Wait for application review (sandbox is instant)

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
ALIPAY_APPID=your_alipay_appid
ALIPAY_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
ALIPAY_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
ALIPAY_NOTIFY_URL=https://yourdomain.com/api/payments/alipay/notify
ALIPAY_RETURN_URL=https://yourdomain.com/payment/success
```

**Important:** Include the full key with headers and `\n` for line breaks.

### 3. Testing

Use Alipay sandbox for testing:
- Gateway: `https://openapi.alipaydev.com/gateway.do`
- Login: https://open.alipay.com/platform/appDaily.htm
- Use test buyer account provided

## Production Checklist

- [ ] SSL certificate installed on server
- [ ] Payment notification URLs configured with HTTPS
- [ ] WeChat Pay merchant account activated
- [ ] Alipay application approved
- [ ] IP whitelist configured (see below)
- [ ] Production API credentials configured
- [ ] Payment callbacks tested in sandbox
- [ ] Idempotency tested (duplicate callbacks)
- [ ] Error handling tested

## IP Whitelist Configuration

Payment providers send callbacks from specific IP ranges. Update in `src/middleware/verifyPayment.js`:

### WeChat Pay IPs (Production)
```
101.226.103.0/24
101.226.62.0/24
101.226.33.0/24
101.201.196.0/24
101.201.177.0/24
101.201.55.0/24
```

### Alipay IPs (Production)
```
110.75.143.0/24
110.75.144.0/24
110.75.145.0/24
110.75.146.0/24
```

**Note:** IP verification is skipped in development mode.

## Testing Payment Callbacks

### WeChat Pay

```bash
# Simulate WeChat Pay callback
curl -X POST http://localhost:4000/api/payments/wechat/notify \
  -H "Content-Type: application/json" \
  -H "wechatpay-serial: XXXX" \
  -H "wechatpay-signature: XXXX" \
  -d '{
    "resource": {
      "ciphertext": "...",
      "nonce": "...",
      "associated_data": "..."
    }
  }'
```

### Alipay

```bash
# Simulate Alipay callback
curl -X POST http://localhost:4000/api/payments/alipay/notify \
  -d "trade_status=TRADE_SUCCESS" \
  -d "out_trade_no=PAY123456" \
  -d "trade_no=2024..." \
  -d "total_amount=99.99" \
  -d "sign=..."
```

## Troubleshooting

### Common Issues

1. **Signature verification fails**
   - Check private/public key format
   - Ensure keys match the environment (sandbox/production)
   - Verify API v3 key for WeChat Pay

2. **IP blocked**
   - Set `NODE_ENV=development` to skip IP check
   - Verify IP ranges in middleware
   - Check actual callback IP in logs

3. **Certificate errors**
   - Verify certificate path
   - Check file permissions
   - Ensure certificate is not expired

4. **Callback not received**
   - Verify notify URL is accessible from internet
   - Check server firewall rules
   - Ensure HTTPS is used in production
   - Look at payment gateway dashboard for callback logs

## Security Best Practices

1. **Never commit certificates to git**
   ```bash
   # Add to .gitignore
   certs/
   .env
   ```

2. **Rotate API keys regularly**
   - WeChat Pay: Every 6 months
   - Alipay: Annually

3. **Monitor for suspicious activity**
   - Check payment logs daily
   - Set up alerts for failed verifications
   - Review high-value transactions

4. **Use HTTPS only in production**
   - Payment callbacks require HTTPS
   - Use Let's Encrypt for free SSL

## Support Resources

- [WeChat Pay Documentation](https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml)
- [Alipay Documentation](https://opendocs.alipay.com/open)
- [wechatpay-node-v3 SDK](https://github.com/kornier/wechatpay-node-v3)
- [alipay-sdk](https://github.com/ali-sdk/alipay-sdk)

## Migration from Mock Payment

The mock payment implementation has been replaced with real payment gateway integration:

1. **Old flow** (mock):
   - `/api/payments/create` → Creates payment record
   - `/api/payments/confirm` → Simulates payment success

2. **New flow** (real):
   - `/api/payments/create` → Creates payment + redirects to payment provider
   - `/api/payments/wechat/notify` → WeChat Pay callback
   - `/api/payments/alipay/notify` → Alipay callback

The `/api/payments/confirm` endpoint can be removed or kept for testing.
