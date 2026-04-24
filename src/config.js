/**
 * MCP Server 配置
 * 通过环境变量配置 API 连接信息
 *
 * CHAINPAY_API_URL    - ChainPay API 地址，默认 https://api.chainpay.to
 * CHAINPAY_API_KEY    - 商户 API Key（在 ChainPay 商户后台获取）
 * CHAINPAY_API_SECRET - 商户 API Secret 明文(不是哈希值)。Secret 在创建 Key
 *                       时只显示一次,丢失需重置。旧版本用的 SHA256 哈希方式
 *                       已废弃,升级后必须填明文。
 */
const config = {
  apiBaseUrl: process.env.CHAINPAY_API_URL || 'https://api.chainpay.to',
  apiKey: process.env.CHAINPAY_API_KEY || '',
  apiSecret: process.env.CHAINPAY_API_SECRET || '',
};

if (!config.apiKey || !config.apiSecret) {
  process.stderr.write(
    '[chainpay-mcp] WARNING: CHAINPAY_API_KEY or CHAINPAY_API_SECRET is not set.\n' +
    'Set these environment variables before using any tools.\n'
  );
}

module.exports = config;
