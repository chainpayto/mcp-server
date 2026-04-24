# @chainpayto/mcp-server

**ChainPay MCP Server** — 让 AI Agent 直接操作 ChainPay 加密货币收款系统。

支持 Claude Desktop、Cursor、Dify、Coze 等任何兼容 [Model Context Protocol](https://modelcontextprotocol.io) 的 AI 平台。

## 功能

| 工具 | 说明 |
|------|------|
| `chainpay_get_supported_chains` | 查询支持的链和代币（含费率、最低金额） |
| `chainpay_create_order` | 创建支付订单，获取收款地址和支付链接 |
| `chainpay_get_order` | 查询指定订单详情和状态 |
| `chainpay_list_orders` | 分页查询订单列表 |
| `chainpay_get_balance` | 查询商户账户余额 |
| `chainpay_create_withdrawal` | 发起提现申请 |

## 快速配置

### 获取 API 凭证

1. 登录 [ChainPay 商户后台](https://chainpay.to/merchant/login)
2. 进入 **API Keys** 页面，创建一个 API Key
3. 复制 `API Key` 和 `API Secret` **明文**（Secret 只显示一次，请妥善保存）
4. 直接把明文填入下面的 `CHAINPAY_API_SECRET`，**不要再做 SHA256 哈希**

> ⚠️ **升级提示**：早期版本要求提前 `sha256sum` 处理 Secret，现已废弃。当前后端用明文 HMAC-SHA256 签名，Secret 明文保存在后台数据库。如果你之前用哈希版配好了，需要到后台 **重置 API Key**，用新 Secret 明文重新填入环境变量。

---

### Claude Desktop

编辑 `~/.config/claude/claude_desktop_config.json`（macOS/Linux）  
或 `%APPDATA%\Claude\claude_desktop_config.json`（Windows）：

```json
{
  "mcpServers": {
    "chainpay": {
      "command": "npx",
      "args": ["-y", "@chainpayto/mcp-server"],
      "env": {
        "CHAINPAY_API_URL": "https://api.chainpay.to",
        "CHAINPAY_API_KEY": "your_api_key",
        "CHAINPAY_API_SECRET": "your_api_secret_plaintext"
      }
    }
  }
}
```

---

### Cursor

编辑 `~/.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "chainpay": {
      "command": "npx",
      "args": ["-y", "@chainpayto/mcp-server"],
      "env": {
        "CHAINPAY_API_KEY": "your_api_key",
        "CHAINPAY_API_SECRET": "your_api_secret_plaintext"
      }
    }
  }
}
```

---

### 全局安装（可选）

如果不想每次都用 `npx`，可以全局安装：

```bash
npm install -g @chainpayto/mcp-server
```

安装后配置中将 `"command": "npx", "args": ["-y", "@chainpayto/mcp-server"]` 改为：

```json
{
  "command": "chainpay-mcp",
  "args": []
}
```

---

## 环境变量

| 变量名 | 必填 | 说明 | 默认值 |
|--------|------|------|--------|
| `CHAINPAY_API_KEY` | ✅ | 商户 API Key | — |
| `CHAINPAY_API_SECRET` | ✅ | API Secret 明文（不是哈希） | — |
| `CHAINPAY_API_URL` | 可选 | API 地址（私有部署时修改） | `https://api.chainpay.to` |

---

## 使用示例

配置完成后，在 AI 对话中直接说：

> "帮我创建一个 50 USDT 的 TRON 链支付订单，订单号 ORDER-001"

> "查询一下 CP20260418163248523136 订单的状态"

> "我的账户余额是多少？"

> "帮我把 100 USDT (BSC) 提现到绑定的地址"

---

## 技术要求

- Node.js >= 18
- 无其他系统依赖，`npx` 自动处理

## 链接

- [ChainPay 官网](https://chainpay.to)
- [API 文档](https://chainpay.to/docs)
- [费率说明](https://chainpay.to/fees)
- [商户注册](https://chainpay.to/merchant/register)

## License

MIT
