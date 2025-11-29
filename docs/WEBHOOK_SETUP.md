# 🔌 Webhook 配置和测试指南

## 问题诊断

如果你看到错误：

-   ❌ "Network error: Cannot reach webhook URL"
-   ❌ "Failed to fetch"

这通常是 webhook URL 配置问题。

---

## 快速修复

### 1. 验证 Webhook URL 格式

正确的格式：

```
https://your-n8n-instance.com/webhook/your-webhook-id
```

❌ 错误格式：

```
http://your-n8n-instance.com    (没有 /webhook/)
localhost:5678                  (不支持本地)
https://example.com/webhook     (缺少 ID)
```

### 2. 测试 Webhook URL

**使用 Postman 或 curl 测试：**

```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "meetingId": "test-123",
    "timestamp": "2024-11-29T10:00:00Z",
    "speaker": "Test User",
    "transcript": "This is a test message",
    "metadata": {
      "type": "TRANSCRIPT_SUBMISSION"
    }
  }'
```

**期望响应：**

```json
{
    "success": true,
    "updatedNotes": [],
    "removedQuestions": []
}
```

### 3. 检查 HTTPS

⚠️ **重要：** 扩展只支持 HTTPS webhook

如果你的 n8n 实例用的是 HTTP：

-   [ ] 升级到 HTTPS（使用 Let's Encrypt）
-   [ ] 或使用 n8n Cloud（已支持 HTTPS）

---

## n8n Webhook 配置

### 步骤 1：创建 Webhook 触发器

1. 打开你的 n8n 工作流
2. 添加新节点 → 选择 "Webhook"
3. 设置：
    - **Method:** POST
    - **Path:** `/interview-webhook` (或自定义)
    - **Authentication:** 无（或根据需要配置）

### 步骤 2：获取 Webhook URL

webhook 节点会显示 URL：

```
https://your-n8n-instance.com/webhook/your-random-id
```

### 步骤 3：配置响应格式

在 webhook 节点之后添加响应节点：

```json
{
    "success": true,
    "message": "Processed",
    "updatedNotes": [
        {
            "id": "q1",
            "question": "问题 1",
            "hint": "提示"
        }
    ],
    "removedQuestions": []
}
```

### 步骤 4：在扩展中配置 URL

1. 打开 Google Meet
2. 点击扩展 → ⚙️ 设置
3. 输入你的 Webhook URL
4. 点击"Save Webhook"

---

## 测试方案

### 方案 A：本地测试（使用 n8n Cloud）

**推荐用于开发**

1. 注册 [n8n Cloud](https://n8n.cloud)
2. 创建工作流和 webhook
3. 获取 HTTPS webhook URL
4. 在扩展中配置

**优点：**

-   自动 HTTPS
-   无需配置
-   可以远程访问

### 方案 B：自托管 n8n + ngrok

**用于本地开发**

1. 启动本地 n8n：

    ```bash
    npm start
    ```

2. 使用 ngrok 暴露：
    ```bash
    ngrok http 5678
    ```
3. 获得 HTTPS URL：

    ```
    https://abc123.ngrok.io
    ```

4. 创建 webhook，获取完整 URL

### 方案 C：Docker + nginx

**用于生产环境**

1. 使用 Docker 运行 n8n
2. 配置 nginx 反向代理
3. 获取 Let's Encrypt 证书
4. 配置 webhook

---

## 常见错误和解决方案

| 错误               | 原因             | 解决方案                          |
| ------------------ | ---------------- | --------------------------------- |
| Failed to fetch    | URL 不可达       | 检查 URL 是否正确、服务器是否运行 |
| Network error      | CORS 或网络问题  | 检查 HTTPS、防火墙、网络连接      |
| 404 Not Found      | Webhook 路径错误 | 验证 webhook ID 和路径            |
| 500 Internal Error | n8n 工作流错误   | 检查 n8n 日志                     |
| No response        | 超时             | 增加超时时间或检查工作流复杂度    |

---

## 调试技巧

### 1. 查看完整错误消息

在 Side Panel 的错误通知中查看详细信息

### 2. 检查 Service Worker 日志

1. 打开 chrome://extensions/
2. 点击你的扩展的 "Service worker"
3. 查看 webhook 调用的日志

### 3. 检查 n8n 执行历史

1. 打开 n8n 工作流
2. 查看 Execution 历史
3. 查看每个请求的输入/输出

### 4. 使用浏览器网络标签

1. 打开 DevTools → Network
2. 点击 Submit Q&A
3. 查看 webhook 请求
4. 检查请求体和响应

---

## 示例 n8n 工作流

### 简单回显工作流

```
[Webhook] → [Echo Node] → [Response]

Echo Node 返回:
{
  "success": true,
  "message": "Received: " + input.data.transcript,
  "updatedNotes": [],
  "removedQuestions": []
}
```

### 包含 AI 分析的工作流

```
[Webhook]
  ↓
[Extract Text]
  ↓
[Call OpenAI API]
  ↓
[Parse Response]
  ↓
[Send Response]
```

---

## 生产部署检查清单

-   [ ] Webhook URL 使用 HTTPS
-   [ ] n8n 实例有备份
-   [ ] 工作流有错误处理
-   [ ] 请求有超时设置
-   [ ] 日志记录已启用
-   [ ] 已测试多种场景
-   [ ] 扩展和 webhook 在同一网络
-   [ ] 防火墙允许出站 HTTPS

---

## 性能优化

### 1. 异步处理

不要让 webhook 做太多同步操作，使用队列。

### 2. 缓存

缓存频繁使用的数据。

### 3. 超时设置

```javascript
// 在 service-worker.js 中
const timeoutId = setTimeout(() => {
    // 如果 5 秒没有响应就超时
}, 5000);
```

### 4. 批量处理

每 10 个请求为一批，而不是逐个处理。

---

## 获取帮助

### 查看日志

1. **Content Script 日志**

    - Google Meet 页面 F12 → Console

2. **Service Worker 日志**

    - chrome://extensions/ → Service Worker DevTools

3. **n8n 日志**

    - n8n UI → 执行历史

4. **浏览器网络**
    - DevTools → Network 标签

### 检查 n8n 状态

```javascript
// 在 DevTools 中测试连接
fetch("YOUR_WEBHOOK_URL", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ test: true }),
})
    .then((r) => r.json())
    .then((data) => console.log("✓ Success:", data))
    .catch((err) => console.error("✗ Error:", err));
```

---

**更新时间：** 2024-11-29  
**版本：** 1.0
