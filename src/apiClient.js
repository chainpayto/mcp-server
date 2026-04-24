const crypto = require('crypto');
const config = require('./config');

// 和后端 backend/src/utils/crypto.js::signParams 一字节对齐:
//   - 过滤 null / undefined,保留空字符串 ""(任何偏差都会让后端 401)
//   - 按 key 字典序排序
//   - 拼接为 k=v&k=v&...
//   - 用 apiSecret 明文 做 HMAC-SHA256
function signParams(params, secret) {
  const sorted = Object.keys(params)
    .filter((k) => k !== 'sign' && params[k] !== undefined && params[k] !== null)
    .sort();
  const str = sorted.map((k) => `${k}=${params[k]}`).join('&');
  return crypto.createHmac('sha256', secret).update(str).digest('hex');
}

// 构建认证 Headers。X-Signature-Version 是 v1 后端强制校验项,漏了直接 401
function buildAuthHeaders(bodyParams = {}, queryParams = {}) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const allParams = { ...bodyParams, ...queryParams, timestamp };
  const sign = signParams(allParams, config.apiSecret);
  return {
    'X-Api-Key': config.apiKey,
    'X-Timestamp': timestamp,
    'X-Sign': sign,
    'X-Signature-Version': 'v1',
    'Content-Type': 'application/json',
  };
}

/**
 * 发起 ChainPay API 请求
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {string} path   - API path，如 /api/v1/orders
 * @param {{ body?: object, query?: object }} options
 * @returns {Promise<any>} - 返回 response.data
 */
async function apiRequest(method, path, options = {}) {
  const { body: bodyData, query: queryParams } = options;

  const url = new URL(path, config.apiBaseUrl);
  if (queryParams) {
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }

  const queryObj = {};
  url.searchParams.forEach((v, k) => { queryObj[k] = v; });

  const headers = buildAuthHeaders(bodyData || {}, queryObj);

  const fetchOptions = { method, headers };
  if (bodyData && method !== 'GET') {
    fetchOptions.body = JSON.stringify(bodyData);
  }

  const response = await fetch(url.toString(), fetchOptions);
  const json = await response.json();

  if (json.code !== 0) {
    throw new Error(json.message || `ChainPay API error: HTTP ${response.status}`);
  }

  return json.data;
}

module.exports = { apiRequest };
