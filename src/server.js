#!/usr/bin/env node

/**
 * ChainPay MCP Server
 *
 * 让 AI Agent（Claude Desktop、Cursor、Dify 等）通过自然语言操作 ChainPay：
 * 查询支持链、创建订单、查询订单、查余额、发起提现。
 *
 * 使用方式（推荐 npx，无需安装）:
 *   npx @chainpayto/mcp-server
 *
 * 环境变量:
 *   CHAINPAY_API_URL    - API 地址，默认 https://api.chainpay.to
 *   CHAINPAY_API_KEY    - 商户 API Key
 *   CHAINPAY_API_SECRET - 商户 API Secret 的 SHA256 哈希值
 *
 * Claude Desktop 配置示例 (~/.config/claude/claude_desktop_config.json):
 * {
 *   "mcpServers": {
 *     "chainpay": {
 *       "command": "npx",
 *       "args": ["-y", "@chainpayto/mcp-server"],
 *       "env": {
 *         "CHAINPAY_API_URL": "https://api.chainpay.to",
 *         "CHAINPAY_API_KEY": "your_api_key",
 *         "CHAINPAY_API_SECRET": "your_api_secret_sha256_hash"
 *       }
 *     }
 *   }
 * }
 *
 * Cursor 配置示例 (~/.cursor/mcp.json):
 * {
 *   "mcpServers": {
 *     "chainpay": {
 *       "command": "npx",
 *       "args": ["-y", "@chainpayto/mcp-server"],
 *       "env": {
 *         "CHAINPAY_API_KEY": "your_api_key",
 *         "CHAINPAY_API_SECRET": "your_api_secret_sha256_hash"
 *       }
 *     }
 *   }
 * }
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { apiRequest } = require('./apiClient');

async function main() {
  const server = new McpServer({
    name: 'chainpay',
    version: '1.0.0',
  });

  // ────────────────────────────────────────────────────────────
  // 查询支持的链和代币
  // ────────────────────────────────────────────────────────────
  server.tool(
    'chainpay_get_supported_chains',
    'Get all blockchain networks and tokens supported by ChainPay, including fee rates and minimum amounts. Call this before creating orders to get valid chain/token values.',
    {},
    async () => {
      try {
        const data = await apiRequest('GET', '/api/v1/supported-chains');
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    },
  );

  // ────────────────────────────────────────────────────────────
  // 创建支付订单
  // ────────────────────────────────────────────────────────────
  server.tool(
    'chainpay_create_order',
    'Create a new cryptocurrency payment order. Returns a payment URL and wallet address for the payer. Supported chains: TRON / BSC / POLYGON. Call chainpay_get_supported_chains first to check minimum amounts.',
    {
      merchant_order_no: z.string().max(64).describe('Your unique order identifier (max 64 chars)'),
      chain: z.string().describe('Blockchain network: "TRON" / "BSC" / "POLYGON"'),
      token: z.string().describe('Token symbol: "USDT" or "USDC" (availability depends on chain)'),
      amount: z.string().describe('Payment amount in USD, e.g. "100.00"'),
      callback_url: z.string().url().optional().describe('Webhook URL for payment status notifications'),
      redirect_url: z.string().url().optional().describe('URL to redirect payer after successful payment'),
    },
    async (args) => {
      try {
        const body = {
          merchant_order_no: args.merchant_order_no,
          chain: args.chain,
          token: args.token,
          amount: args.amount,
        };
        if (args.callback_url) body.callback_url = args.callback_url;
        if (args.redirect_url) body.redirect_url = args.redirect_url;
        const data = await apiRequest('POST', '/api/v1/orders', { body });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    },
  );

  // ────────────────────────────────────────────────────────────
  // 查询单个订单
  // ────────────────────────────────────────────────────────────
  server.tool(
    'chainpay_get_order',
    'Get details and current status of a specific payment order.',
    {
      order_no: z.string().describe('ChainPay order number (starts with "CP")'),
    },
    async (args) => {
      try {
        const data = await apiRequest('GET', `/api/v1/orders/${args.order_no}`);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    },
  );

  // ────────────────────────────────────────────────────────────
  // 订单列表
  // ────────────────────────────────────────────────────────────
  server.tool(
    'chainpay_list_orders',
    'List payment orders with pagination and optional status filter.',
    {
      page: z.number().int().min(1).optional().describe('Page number (starts from 1)'),
      pageSize: z.number().int().min(1).max(100).optional().describe('Orders per page, default 20'),
      status: z.enum(['pending', 'confirming', 'paid', 'expired', 'failed']).optional()
        .describe('Filter by order status'),
    },
    async (args) => {
      try {
        const query = {};
        if (args.page)     query.page = args.page;
        if (args.pageSize) query.pageSize = args.pageSize;
        if (args.status)   query.status = args.status;
        const data = await apiRequest('GET', '/api/v1/orders', { query });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    },
  );

  // ────────────────────────────────────────────────────────────
  // 查询余额
  // ────────────────────────────────────────────────────────────
  server.tool(
    'chainpay_get_balance',
    'Get the merchant account balance including total balance, frozen amount, and available balance.',
    {},
    async () => {
      try {
        const data = await apiRequest('GET', '/api/v1/merchant/balance');
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    },
  );

  // ────────────────────────────────────────────────────────────
  // 发起提现
  // ────────────────────────────────────────────────────────────
  server.tool(
    'chainpay_create_withdrawal',
    'Submit a withdrawal request to transfer funds to the merchant\'s bound withdrawal address. Requires a withdrawal address to be configured in the merchant dashboard. May require admin approval.',
    {
      amount: z.string().describe('Withdrawal amount, e.g. "50.00"'),
      chainId: z.number().int().describe('Chain ID from chainpay_get_supported_chains'),
      tokenSymbol: z.string().describe('Token symbol, e.g. "USDT" or "USDC"'),
    },
    async (args) => {
      try {
        const body = {
          amount: args.amount,
          chainId: args.chainId,
          tokenSymbol: args.tokenSymbol,
        };
        const data = await apiRequest('POST', '/api/v1/merchant/withdrawals', { body });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`[chainpay-mcp] Fatal error: ${err.message}\n`);
  process.exit(1);
});
