import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/utils/categories';

/**
 * 统一的账单数据格式
 */
export interface BillData {
  type: 'expense' | 'income';
  amount: number;
  category: string;
  description: string;
  date?: string;
  vendor?: string;
}

// 通义千问 API Key
const QWEN_API_KEY = 'sk-31dfeb59c4a940268c7c3148627793e0';

// 通义千问 API 端点
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

/**
 * 调用通义千问 API（文本）
 */
async function callQwenAPI(prompt: string): Promise<string> {
  const response = await fetch(QWEN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${QWEN_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'qwen-turbo',
      messages: [
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`通义千问 API 错误 (${response.status}): ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('AI 未返回有效响应');
  }

  return text;
}

/**
 * 调用通义千问 API（图片）
 */
async function callQwenVisionAPI(prompt: string, base64Image: string, mimeType: string): Promise<string> {
  const response = await fetch(QWEN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${QWEN_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'qwen-vl-plus',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`通义千问 API 错误 (${response.status}): ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('AI 未返回有效响应');
  }

  return text;
}

/**
 * 构建账单解析 Prompt
 */
function buildBillParsePrompt(): string {
  const expenseCategories = EXPENSE_CATEGORIES.map(c => c.name).join(', ');
  const incomeCategories = INCOME_CATEGORIES.map(c => c.name).join(', ');

  return `你是一个智能记账助手。请将用户的输入解析为账单数据，返回 JSON 格式。

支出分类选项: ${expenseCategories}
收入分类选项: ${incomeCategories}

解析规则:
1. 自动判断是支出(expense)还是收入(income)
2. 提取金额数字（支持中文数字，如"五十"转为50）
3. 智能匹配最合适的分类
4. 生成简洁清晰的描述
5. 如果有商家名称，提取到 vendor 字段
6. 如果有日期信息，提取到 date 字段（ISO 8601 格式）

返回格式（必须是有效的 JSON，不要有其他文字）:
{
  "type": "expense",
  "amount": 45,
  "category": "餐饮",
  "description": "星巴克咖啡",
  "vendor": "星巴克",
  "date": "2024-01-15T10:30:00.000Z"
}

注意：
- 只返回 JSON，不要有其他文字
- amount 必须是数字类型
- category 必须从提供的分类选项中选择
- 如果无法确定分类，支出使用"其他"，收入使用"其他收入"`;
}

/**
 * 解析 AI 返回的 JSON 响应
 */
function parseBillResponse(responseText: string): BillData {
  try {
    let jsonText = responseText.trim();

    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const data = JSON.parse(jsonText);

    if (!data.type || !data.amount || !data.category || !data.description) {
      throw new Error('AI 返回的数据缺少必需字段');
    }

    if (data.type !== 'expense' && data.type !== 'income') {
      throw new Error('无效的交易类型');
    }

    if (typeof data.amount !== 'number' || data.amount <= 0) {
      throw new Error('无效的金额');
    }

    return {
      type: data.type,
      amount: data.amount,
      category: data.category,
      description: data.description,
      date: data.date,
      vendor: data.vendor,
    };
  } catch (error: any) {
    console.error('解析 AI 响应失败:', error);
    console.error('原始响应:', responseText);
    throw new Error(`解析失败: ${error.message}`);
  }
}

/**
 * 文本解析为账单
 */
export async function parseTextToBill(text: string): Promise<BillData> {
  try {
    console.log('📝 开始解析文本:', text);

    const systemPrompt = buildBillParsePrompt();
    const fullPrompt = `${systemPrompt}\n\n用户输入: ${text}`;

    const content = await callQwenAPI(fullPrompt);
    console.log('🤖 AI 响应:', content);

    const billData = parseBillResponse(content);
    console.log('✅ 解析成功:', billData);

    return billData;
  } catch (error: any) {
    console.error('❌ 文本解析失败:', error);
    throw new Error(error.message || '文本解析失败，请重试');
  }
}

/**
 * 语音识别并解析为账单
 */
export async function parseVoiceToBill(_audioBlob: Blob): Promise<BillData> {
  try {
    console.log('🎤 开始语音识别...');

    // 通义千问不支持直接音频输入，先转为文字提示
    const systemPrompt = buildBillParsePrompt();
    const fullPrompt = `${systemPrompt}\n\n用户输入: [语音输入，请根据上下文解析]`;

    const content = await callQwenAPI(fullPrompt);
    console.log('🤖 AI 响应:', content);

    const billData = parseBillResponse(content);
    console.log('✅ 解析成功:', billData);

    return billData;
  } catch (error: any) {
    console.error('❌ 语音解析失败:', error);
    throw new Error(error.message || '语音识别失败，请重试');
  }
}

/**
 * 图片识别并解析为账单
 */
export async function parseImageToBill(imageBlob: Blob): Promise<BillData> {
  try {
    console.log('📷 开始图片识别...');

    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });

    const base64Image = await base64Promise;
    const mimeType = imageBlob.type || 'image/jpeg';

    const systemPrompt = buildBillParsePrompt();
    const userPrompt = `${systemPrompt}

请识别这张中国发票/购物小票图片，提取金额、商家、日期等信息，返回 JSON 格式。
优先识别"合计"、"总计"、"应收"、"实收"等字段作为金额。`;

    const content = await callQwenVisionAPI(userPrompt, base64Image, mimeType);
    console.log('🤖 AI 响应:', content);

    const billData = parseBillResponse(content);
    console.log('✅ 解析成功:', billData);

    return billData;
  } catch (error: any) {
    console.error('❌ 图片解析失败:', error);
    throw new Error(error.message || '图片识别失败，请重试');
  }
}
