# chat bot

簡潔、有質感的繁體中文聊天頁面，前端使用 HTML/CSS/JavaScript，後端使用 Google Apps Script 串接 OpenAI Responses API。

## 功能

- 聊天機器人名稱：`chat bot5`
- 人設：女性、開朗、溫柔、細心
- 模型：`gpt-5.4-mini`
- 按 `Enter` 直接送出，`Shift + Enter` 換行
- 對話時間格式：`yyyy/MM/dd HH:mm:ss`，使用台北時區與 24 小時制
- 使用者與 `chat bot5` 的訊息會寫入指定 Google 試算表

## 檔案

- `index.html`：聊天頁面結構
- `styles.css`：簡潔質感 UI 樣式
- `app.js`：前端互動與 GAS 呼叫
- `gas/Code.gs`：Google Apps Script 後端

## 後端設定

1. 到 Apps Script 專案貼上 `gas/Code.gs`。
2. 確認指令碼屬性已有 `OPENAI_API_KEY`。
3. 部署為 Web App，權限建議設定為可由網頁呼叫。
4. 若重新部署產生新的 `/exec` URL，請同步更新 `app.js` 裡的 `GAS_ENDPOINT`。

## 試算表欄位

後端會使用 `chat_log` 工作表，欄位如下：

- `時間`
- `角色`
- `內容`
- `模型`

指定試算表 ID：`18qEKaNKIlEaKYwTPIZjR38YTbF754N2HcPwh1TXGisw`
