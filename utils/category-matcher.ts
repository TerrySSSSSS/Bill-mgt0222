import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './categories';

export type Category = typeof EXPENSE_CATEGORIES[number] | typeof INCOME_CATEGORIES[number];

/**
 * 分类关键词映射表
 * 用于将用户输入或 AI 识别的关键词映射到系统分类
 */
const CATEGORY_KEYWORDS: Record<string, { expense?: string; income?: string }> = {
  // 餐饮相关
  '吃': { expense: '餐饮' },
  '喝': { expense: '餐饮' },
  '饭': { expense: '餐饮' },
  '餐': { expense: '餐饮' },
  '食': { expense: '餐饮' },
  '咖啡': { expense: '餐饮' },
  '奶茶': { expense: '餐饮' },
  '外卖': { expense: '餐饮' },
  '快餐': { expense: '餐饮' },
  '火锅': { expense: '餐饮' },
  '烧烤': { expense: '餐饮' },
  '西餐': { expense: '餐饮' },
  '中餐': { expense: '餐饮' },
  '日料': { expense: '餐饮' },
  '韩餐': { expense: '餐饮' },
  '甜品': { expense: '餐饮' },
  '零食': { expense: '餐饮' },
  '水果': { expense: '餐饮' },
  '蔬菜': { expense: '餐饮' },
  '超市': { expense: '餐饮' },
  '便利店': { expense: '餐饮' },
  '星巴克': { expense: '餐饮' },
  '麦当劳': { expense: '餐饮' },
  '肯德基': { expense: '餐饮' },
  '必胜客': { expense: '餐饮' },
  '海底捞': { expense: '餐饮' },
  '喜茶': { expense: '餐饮' },
  '瑞幸': { expense: '餐饮' },
  '美团': { expense: '餐饮' },
  '饿了么': { expense: '餐饮' },
  '沃尔玛': { expense: '餐饮' },
  '家乐福': { expense: '餐饮' },
  '永辉': { expense: '餐饮' },
  '盒马': { expense: '餐饮' },

  // 交通相关
  '车': { expense: '交通' },
  '打车': { expense: '交通' },
  '出租': { expense: '交通' },
  '滴滴': { expense: '交通' },
  '地铁': { expense: '交通' },
  '公交': { expense: '交通' },
  '火车': { expense: '交通' },
  '高铁': { expense: '交通' },
  '飞机': { expense: '交通' },
  '机票': { expense: '交通' },
  '加油': { expense: '交通' },
  '停车': { expense: '交通' },
  '过路': { expense: '交通' },
  '维修': { expense: '交通' },
  '保养': { expense: '交通' },
  '中石油': { expense: '交通' },
  '中石化': { expense: '交通' },
  '壳牌': { expense: '交通' },
  '曹操': { expense: '交通' },
  '首汽': { expense: '交通' },
  '神州': { expense: '交通' },
  '哈啰': { expense: '交通' },
  '美团打车': { expense: '交通' },
  '高德': { expense: '交通' },

  // 购物相关
  '买': { expense: '购物' },
  '购': { expense: '购物' },
  '衣服': { expense: '购物' },
  '鞋': { expense: '购物' },
  '包': { expense: '购物' },
  '化妆': { expense: '购物' },
  '护肤': { expense: '购物' },
  '美妆': { expense: '购物' },
  '电子': { expense: '购物' },
  '手机': { expense: '购物' },
  '电脑': { expense: '购物' },
  '数码': { expense: '购物' },
  '家电': { expense: '购物' },
  '淘宝': { expense: '购物' },
  '京东': { expense: '购物' },
  '拼多多': { expense: '购物' },
  '天猫': { expense: '购物' },
  '苏宁': { expense: '购物' },
  '国美': { expense: '购物' },
  '优衣库': { expense: '购物' },
  'ZARA': { expense: '购物' },
  'HM': { expense: '购物' },
  '屈臣氏': { expense: '购物' },
  '丝芙兰': { expense: '购物' },
  '万达': { expense: '购物' },
  '银泰': { expense: '购物' },

  // 居家相关
  '房': { expense: '居家' },
  '租': { expense: '居家' },
  '房租': { expense: '居家' },
  '物业': { expense: '居家' },
  '家具': { expense: '居家' },
  '装修': { expense: '居家' },
  '日用': { expense: '居家' },
  '清洁': { expense: '居家' },

  // 娱乐相关
  '玩': { expense: '娱乐' },
  '游戏': { expense: '娱乐' },
  '电影': { expense: '娱乐' },
  '演出': { expense: '娱乐' },
  '音乐': { expense: '娱乐' },
  '旅游': { expense: '娱乐' },
  '旅行': { expense: '娱乐' },
  '酒店': { expense: '娱乐' },
  '景点': { expense: '娱乐' },
  'KTV': { expense: '娱乐' },
  '酒吧': { expense: '娱乐' },
  '健身': { expense: '娱乐' },
  '运动': { expense: '娱乐' },

  // 医疗相关
  '医': { expense: '医疗' },
  '药': { expense: '医疗' },
  '病': { expense: '医疗' },
  '看病': { expense: '医疗' },
  '医院': { expense: '医疗' },
  '诊所': { expense: '医疗' },
  '体检': { expense: '医疗' },
  '保健': { expense: '医疗' },
  '挂号': { expense: '医疗' },

  // 教育相关
  '学': { expense: '教育' },
  '课': { expense: '教育' },
  '书': { expense: '教育' },
  '培训': { expense: '教育' },
  '学费': { expense: '教育' },
  '教材': { expense: '教育' },
  '文具': { expense: '教育' },
  '考试': { expense: '教育' },

  // 水电相关
  '水': { expense: '水电' },
  '电': { expense: '水电' },
  '气': { expense: '水电' },
  '水费': { expense: '水电' },
  '电费': { expense: '水电' },
  '燃气': { expense: '水电' },
  '暖气': { expense: '水电' },

  // 通讯相关
  '话费': { expense: '通讯' },
  '流量': { expense: '通讯' },
  '宽带': { expense: '通讯' },
  '网费': { expense: '通讯' },
  '充值': { expense: '通讯' },

  // 工资相关
  '工资': { income: '工资' },
  '薪水': { income: '工资' },
  '薪资': { income: '工资' },
  '月薪': { income: '工资' },
  '收入': { income: '工资' },

  // 奖金相关
  '奖': { income: '奖金' },
  '奖金': { income: '奖金' },
  '年终': { income: '奖金' },
  '提成': { income: '奖金' },
  '绩效': { income: '奖金' },

  // 投资相关
  '投资': { income: '投资' },
  '理财': { income: '投资' },
  '股票': { income: '投资' },
  '基金': { income: '投资' },
  '分红': { income: '投资' },
  '利息': { income: '投资' },

  // 兼职相关
  '兼职': { income: '兼职' },
  '外快': { income: '兼职' },
  '副业': { income: '兼职' },

  // 红包相关
  '红包': { income: '红包' },
  '礼金': { income: '红包' },
  '转账': { income: '红包' },
};

/**
 * 智能匹配分类
 * @param aiCategory AI 返回的分类名称
 * @param type 交易类型
 * @returns 匹配的系统分类
 */
export function matchCategory(
  aiCategory: string,
  type: 'expense' | 'income'
): Category {
  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // 1. 精确匹配
  const exactMatch = categories.find(c => c.name === aiCategory);
  if (exactMatch) {
    return exactMatch;
  }

  // 2. 关键词匹配
  for (const [keyword, mapping] of Object.entries(CATEGORY_KEYWORDS)) {
    const targetCategory = type === 'expense' ? mapping.expense : mapping.income;
    if (targetCategory && aiCategory.includes(keyword)) {
      const match = categories.find(c => c.name === targetCategory);
      if (match) {
        return match;
      }
    }
  }

  // 3. 模糊匹配（检查 AI 分类是否包含系统分类名）
  const fuzzyMatch = categories.find(c =>
    aiCategory.includes(c.name) || c.name.includes(aiCategory)
  );
  if (fuzzyMatch) {
    return fuzzyMatch;
  }

  // 4. 默认返回"其他"
  return categories[categories.length - 1];
}

/**
 * 验证并修正账单数据的分类
 * @param billData 账单数据
 * @returns 修正后的账单数据
 */
export function validateAndFixCategory(billData: {
  type: 'expense' | 'income';
  category: string;
  [key: string]: any;
}): typeof billData {
  const matchedCategory = matchCategory(billData.category, billData.type);

  return {
    ...billData,
    category: matchedCategory.name,
  };
}
