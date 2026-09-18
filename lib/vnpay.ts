import crypto from 'crypto';

export const VNPAY_CONFIG = {
  tmnCode: process.env.VNP_TMN_CODE || '04BTMRVW',
  hashSecret: process.env.VNP_HASH_SECRET || 'GPVG20ZSC8A2CCOHIQ4S99GTJ92AS34S',
  vnpUrl: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  returnUrl: process.env.NEXT_PUBLIC_BASE_URL 
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/vnpay-return`
    : 'https://skyline-smart-residence.vercel.app/api/billing/vnpay-return',
};

// Thông tin thẻ test NCB chính thức được VNPAY cấp trong Sandbox
export const VNPAY_NCB_TEST_CARD = {
  bank: 'NCB',
  cardNumber: '9704198526191432198',
  cardHolder: 'NGUYEN VAN A',
  issueDate: '07/15',
  otp: '123456',
};

/**
 * Định dạng ngày theo chuẩn VNPay YYYYMMDDHHmmss theo múi giờ Việt Nam (UTC+7)
 */
export function getVnpayDate(d = new Date()): string {
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const vnTime = new Date(utc + (3600000 * 7));
  const YYYY = vnTime.getFullYear();
  const MM = String(vnTime.getMonth() + 1).padStart(2, '0');
  const DD = String(vnTime.getDate()).padStart(2, '0');
  const HH = String(vnTime.getHours()).padStart(2, '0');
  const mm = String(vnTime.getMinutes()).padStart(2, '0');
  const ss = String(vnTime.getSeconds()).padStart(2, '0');
  return `${YYYY}${MM}${DD}${HH}${mm}${ss}`;
}

/**
 * Sắp xếp các tham số theo thứ tự alphabet và encode URI đúng chuẩn VNPAY
 */
export function sortObject(obj: Record<string, any>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const str: string[] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (let key = 0; key < str.length; key++) {
    const rawKey = decodeURIComponent(str[key]);
    sorted[str[key]] = encodeURIComponent(String(obj[rawKey])).replace(/%20/g, '+');
  }
  return sorted;
}

export interface CreatePaymentUrlParams {
  billId: string;
  amount: number;
  orderInfo?: string;
  ipAddr?: string;
  bankCode?: string;
  returnUrl?: string;
}

/**
 * Tạo URL thanh toán VNPAY Sandbox có kèm mã checksum HMAC-SHA512
 */
export function buildVnpayPaymentUrl(params: CreatePaymentUrlParams): string {
  const dateStr = getVnpayDate();
  const createDate = dateStr;
  const tmnCode = VNPAY_CONFIG.tmnCode;
  const secretKey = VNPAY_CONFIG.hashSecret;
  const vnpUrl = VNPAY_CONFIG.vnpUrl;
  const returnUrl = params.returnUrl || VNPAY_CONFIG.returnUrl;
  
  // vnp_TxnRef duy nhất cho mỗi lượt thanh toán
  const txnRef = `${params.billId}_${Date.now()}`;
  const amount = Math.round(params.amount) * 100; // VNPAY quy định nhân 100
  const orderInfo = params.orderInfo || `Thanh toan hoa don ${params.billId}`;
  const ipAddr = params.ipAddr || '127.0.0.1';

  const vnp_Params: Record<string, any> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'billpayment',
    vnp_Amount: amount,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  if (params.bankCode && params.bankCode.trim() !== '') {
    vnp_Params['vnp_BankCode'] = params.bankCode.trim();
  }

  const sortedParams = sortObject(vnp_Params);
  const signData = Object.entries(sortedParams)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const finalQuery = `${signData}&vnp_SecureHash=${signed}`;
  return `${vnpUrl}?${finalQuery}`;
}

/**
 * Xác minh tính toàn vẹn chữ ký HMAC-SHA512 từ VNPAY Return URL hoặc IPN Webhook
 */
export function verifyVnpayChecksum(queryParams: Record<string, string>): {
  isValid: boolean;
  secureHash: string;
  calculatedHash: string;
  params: Record<string, string>;
} {
  const secretKey = VNPAY_CONFIG.hashSecret;
  const secureHash = queryParams['vnp_SecureHash'] || '';

  const cleanParams: Record<string, string> = {};
  for (const [key, val] of Object.entries(queryParams)) {
    if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
      cleanParams[key] = val;
    }
  }

  const sortedParams = sortObject(cleanParams);
  const signData = Object.entries(sortedParams)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', secretKey);
  const calculatedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const isValid = secureHash.toLowerCase() === calculatedHash.toLowerCase();

  return {
    isValid,
    secureHash,
    calculatedHash,
    params: cleanParams,
  };
}
