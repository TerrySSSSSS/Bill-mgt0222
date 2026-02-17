import { getInsforgeClient, initInsforgeClient } from './insforge-client';
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

/**
 * 构建 AI Prompt，用于解析账单数据
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

返回格式（必须是有效的 JSON）:
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
    // 尝试提取 JSON（处理可能的 markdown 代码块）
    let jsonText = responseText.trim();

    // 移除可能的 markdown 代码块标记
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const data = JSON.parse(jsonText);

    // 验证必需字段
    if (!data.type || !data.amount || !data.category || !data.description) {
      throw new Error('AI 返回的数据缺少必需字段');
    }

    // 验证类型
    if (data.type !== 'expense' && data.type !== 'income') {
      throw new Error('无效的交易类型');
    }

    // 验证金额
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
 * @param text 用户输入的文本描述
 * @returns 解析后的账单数据
 */
export async function parseTextToBill(text: string): Promise<BillData> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    console.log('📝 开始解析文本:', text);

    const systemPrompt = buildBillParsePrompt();

    // 调用 AI API
    const response = await client.ai.chat.completions.create({
      model: 'gemini-2.0-flash-001', // 使用 Gemini 2.0 Flash 001
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.3, // 降低随机性，提高准确性
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI 未返回有效响应');
    }

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
 * @param audioBlob 音频文件 Blob
 * @returns 解析后的账单数据
 */
export async function parseVoiceToBill(audioBlob: Blob): Promise<BillData> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    console.log('🎤 开始语音识别...');

    // 使用 Gemini 2.0 Flash 的音频识别功能
    // Gemini 支持直接处理音频文件

    // 将音频转换为 base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });

    const base64Audio = await base64Promise;

    const systemPrompt = buildBillParsePrompt();
    const userPrompt = '请识别这段语音中的内容，并解析为账单数据。';

    // 使用 Gemini 2.0 Flash 001 识别音频
    const response = await client.ai.chat.completions.create({
      model: 'gemini-2.0-flash-001', // 使用 Gemini 2.0 Flash 001（支持音频输入）
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: base64Audio } } // 使用相同的格式处理音频
          ]
        }
      ],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI 未返回有效响应');
    }

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
 * @param imageBlob 图片文件 Blob
 * @returns 解析后的账单数据
 */
export async function parseImageToBill(imageBlob: Blob): Promise<BillData> {
  try {
    await initInsforgeClient();
    const client = getInsforgeClient();

    console.log('📷 开始图片识别...');

    // 将图片转换为 base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });

    const base64Image = await base64Promise;

    const systemPrompt = buildBillParsePrompt();

    // 针对中国发票和小票的专门提示词
    const userPrompt = `请识别这张中国发票/购物小票图片，提取以下信息并解析为账单数据：

识别要点：
1. **金额识别**：
   - 优先识别"合计"、"总计"、"应收"、"实收"、"小计"等字段
   - 注意区分含税金额和不含税金额
   - 支持人民币符号：¥、￥、RMB
   - 支持中文大写金额：壹、贰、叁等

2. **商家识别**：
   - 识别商家名称、店铺名称
   - 常见商家：超市、便利店、餐厅、商场等
   - 注意识别连锁品牌：如沃尔玛、家乐福、星巴克等

3. **日期识别**：
   - 识别开票日期、交易日期
   - 支持格式：YYYY-MM-DD、YYYY年MM月DD日等

4. **分类判断**：
   - 根据商家类型和商品内容智能判断分类
   - 超市/便利店 → 餐饮或购物
   - 餐厅/咖啡店 → 餐饮
   - 加油站 → 交通
   - 药店 → 医疗

5. **中国特色识别**：
   - 电子发票：识别发票代码、发票号码
   - 增值税发票：识别税额、税率
   - 购物小票：识别商品明细
   - 支付方式：微信支付、支付宝、银联等

请返回标准的 JSON 格式。`;

    // 使用 vision 模型识别图片
    // Gemini 2.0 Flash 001 支持图片识别
    const response = await client.ai.chat.completions.create({
      model: 'gemini-2.0-flash-001', // 使用 Gemini 2.0 Flash 001
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: base64Image } }
          ]
        }
      ],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('AI 未返回有效响应');
    }

    console.log('🤖 AI 响应:', content);

    const billData = parseBillResponse(content);
    console.log('✅ 解析成功:', billData);

    return billData;
  } catch (error: any) {
    console.error('❌ 图片解析失败:', error);
    throw new Error(error.message || '图片识别失败，请重试');
  }
}
