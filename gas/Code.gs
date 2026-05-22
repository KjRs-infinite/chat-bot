const OPENAI_MODEL = 'gpt-5.4-mini';
const SPREADSHEET_ID = '18qEKaNKIlEaKYwTPIZjR38YTbF754N2HcPwh1TXGisw';
const SHEET_NAME = 'chat_log';
const TIME_ZONE = 'Asia/Taipei';
const BOT_NAME = 'chat bot5';
const USER_NAME = '使用者';

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const userMessage = String(payload.message || '').trim();
    const history = Array.isArray(payload.history) ? payload.history : [];

    if (!userMessage) {
      return jsonOutput_({ ok: false, error: '請輸入訊息。' });
    }

    const userTimestamp = formatTimestamp_(new Date());
    appendLogRow_(userTimestamp, USER_NAME, userMessage);

    const reply = generateReply_(userMessage, history);
    const botTimestamp = formatTimestamp_(new Date());
    appendLogRow_(botTimestamp, BOT_NAME, reply);

    return jsonOutput_({
      ok: true,
      reply: reply,
      timestamp: botTimestamp,
      model: OPENAI_MODEL,
    });
  } catch (error) {
    return jsonOutput_({
      ok: false,
      error: error && error.message ? error.message : '伺服器發生未知錯誤。',
    });
  }
}

function doGet() {
  return jsonOutput_({
    ok: true,
    status: 'ready',
    botName: BOT_NAME,
    model: OPENAI_MODEL,
    sheetName: SHEET_NAME,
  });
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }

  return JSON.parse(e.postData.contents);
}

function generateReply_(message, history) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('尚未在 Apps Script 指令碼屬性設定 OPENAI_API_KEY。');
  }

  const input = buildInputText_(message, history);
  const response = UrlFetchApp.fetch('https://api.openai.com/v1/responses', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + apiKey,
    },
    muteHttpExceptions: true,
    payload: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: [
        '你是 chat bot5，一位女性聊天機器人。',
        '你的性格開朗、溫柔、細心，說話自然親切。',
        '請一律使用繁體中文回覆。',
        '可以適度活潑，但不要過度誇張；讓使用者感到被理解、被陪伴。',
        '若使用者提出危險、醫療、法律或財務等高風險問題，請溫和提醒尋求專業協助。',
      ].join('\n'),
      input: input,
      max_output_tokens: 700,
      store: false,
    }),
  });

  const statusCode = response.getResponseCode();
  const rawText = response.getContentText();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('OpenAI API 呼叫失敗：' + rawText);
  }

  const result = JSON.parse(rawText);
  const reply = extractTextFromResponse_(result);
  if (!reply) {
    throw new Error('OpenAI API 未回傳可顯示的文字內容。');
  }

  return reply;
}

function buildInputText_(message, history) {
  const lines = [];
  const recentHistory = history.slice(-12);

  recentHistory.forEach(function(entry) {
    const speaker = entry.role === 'assistant' ? BOT_NAME : USER_NAME;
    const text = String(entry.text || '').trim();

    if (text) {
      lines.push(speaker + '：' + text);
    }
  });

  lines.push(USER_NAME + '：' + message);

  return [
    '以下是最近的聊天紀錄，請自然延續對話。',
    lines.join('\n'),
  ].join('\n\n');
}

function extractTextFromResponse_(result) {
  if (result.output_text) {
    return String(result.output_text).trim();
  }

  const output = result.output || [];
  for (let i = 0; i < output.length; i += 1) {
    const content = output[i].content || [];
    for (let j = 0; j < content.length; j += 1) {
      if (content[j].type === 'output_text' && content[j].text) {
        return String(content[j].text).trim();
      }
    }
  }

  return '';
}

function appendLogRow_(timestamp, speaker, message) {
  const sheet = getOrCreateSheet_();
  sheet.appendRow([timestamp, speaker, message, OPENAI_MODEL]);
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(['時間', '角色', '內容', '模型']);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function formatTimestamp_(date) {
  return Utilities.formatDate(date, TIME_ZONE, 'yyyy/MM/dd HH:mm:ss');
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
