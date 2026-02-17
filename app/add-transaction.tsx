import { CategoryPicker } from '@/components/CategoryPicker';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccountStore } from '@/store/useAccountStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/utils/categories';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextBillInput from '@/components/TextBillInput';
import VoiceBillInput from '@/components/VoiceBillInput';
import ImageBillInput from '@/components/ImageBillInput';
import { BillData } from '@/services/insforge-ai';
import { matchCategory } from '@/utils/category-matcher';

type TransactionType = 'expense' | 'income';

export default function AddTransactionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { id, aiData } = useLocalSearchParams<{ id?: string; aiData?: string }>();
  const isEditMode = !!id;

  const { accounts, fetchAccounts } = useAccountStore();
  const { addTransaction, updateTransaction, getTransactionById } = useTransactionStore();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [originalDate, setOriginalDate] = useState<string | null>(null);

  // AI 智能输入 Modal 状态
  const [showTextInput, setShowTextInput] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);

  // 加载账户数据
  useEffect(() => { fetchAccounts(); }, []);

  // 编辑模式下加载交易数据
  useEffect(() => {
    if (isEditMode && id) {
      loadTransaction(parseInt(id));
    }
  }, [id]);

  // 仅在新建模式下自动选择第一个账户
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId && !isEditMode) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, isEditMode]);

  // 仅在新建模式下，切换类型时重置分类
  useEffect(() => {
    if (!isEditMode) {
      setSelectedCategory((type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES)[0]);
    }
  }, [type, isEditMode]);

  // 处理从主页面传递过来的 AI 识别结果
  useEffect(() => {
    if (aiData && !isEditMode) {
      try {
        const billData: BillData = JSON.parse(aiData);
        handleAIResult(billData);
      } catch (error) {
        console.error('解析 AI 数据失败:', error);
      }
    }
  }, [aiData, isEditMode]);

  const loadTransaction = async (transactionId: number) => {
    setIsLoading(true);
    try {
      const transaction = await getTransactionById(transactionId);
      if (transaction) {
        setType(transaction.type);
        setAmount(transaction.amount.toString());
        setSelectedAccountId(transaction.account_id);
        setDescription(transaction.description);
        setOriginalDate(transaction.date);

        // 设置分类
        const categories = transaction.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
        const category = categories.find(c => c.name === transaction.category) || categories[0];
        setSelectedCategory(category);
      }
    } catch (error) {
      Alert.alert('错误', '加载交易记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理 AI 识别结果
  const handleAIResult = (billData: BillData) => {
    // 设置交易类型
    setType(billData.type);

    // 设置金额
    setAmount(billData.amount.toString());

    // 设置描述
    setDescription(billData.description);

    // 智能匹配分类
    const matchedCategory = matchCategory(billData.category, billData.type);
    setSelectedCategory(matchedCategory);

    console.log('✅ AI 识别结果已应用到表单:', billData);
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('提示', '请输入有效金额');
      return;
    }
    if (!selectedAccountId) {
      Alert.alert('提示', '请选择账户');
      return;
    }

    try {
      if (isEditMode && id) {
        await updateTransaction(parseInt(id), {
          type,
          amount: parseFloat(amount),
          category: selectedCategory.name,
          category_icon: selectedCategory.icon,
          account_id: selectedAccountId,
          date: originalDate || new Date().toISOString(),
          description: description || selectedCategory.name
        });
      } else {
        await addTransaction({
          type,
          amount: parseFloat(amount),
          category: selectedCategory.name,
          category_icon: selectedCategory.icon,
          account_id: selectedAccountId,
          date: new Date().toISOString(),
          description: description || selectedCategory.name
        });
      }
      router.back();
    } catch (error) {
      Alert.alert('错误', isEditMode ? '更新失败' : '保存失败');
    }
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><X size={24} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{isEditMode ? '编辑交易' : '记一笔'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          <Text style={[styles.saveBtn, { color: isLoading ? colors.textSecondary : colors.primary }]}>
            {isLoading ? '加载中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* AI 智能输入按钮 */}
        {!isEditMode && (
          <View style={[styles.aiInputSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.aiInputTitle, { color: colors.text }]}>🤖 AI 智能输入</Text>
            <View style={styles.aiButtonRow}>
              <TouchableOpacity
                style={[styles.aiButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowTextInput(true)}
              >
                <Text style={styles.aiButtonIcon}>📝</Text>
                <Text style={styles.aiButtonText}>文本</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.aiButton, { backgroundColor: colors.income }]}
                onPress={() => setShowVoiceInput(true)}
              >
                <Text style={styles.aiButtonIcon}>🎤</Text>
                <Text style={styles.aiButtonText}>语音</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.aiButton, { backgroundColor: colors.expense }]}
                onPress={() => setShowImageInput(true)}
              >
                <Text style={styles.aiButtonIcon}>📷</Text>
                <Text style={styles.aiButtonText}>拍照</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.typeSelector}>
          <TouchableOpacity style={[styles.typeBtn, type === 'expense' && { backgroundColor: colors.expense }]} onPress={() => setType('expense')}>
            <Text style={[styles.typeText, { color: type === 'expense' ? '#FFF' : colors.textSecondary }]}>支出</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, type === 'income' && { backgroundColor: colors.income }]} onPress={() => setType('income')}>
            <Text style={[styles.typeText, { color: type === 'income' ? '#FFF' : colors.textSecondary }]}>收入</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.amountCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>金额</Text>
          <View style={styles.amountRow}>
            <Text style={[styles.currency, { color: type === 'expense' ? colors.expense : colors.income }]}>¥</Text>
            <TextInput style={[styles.amountInput, { color: colors.text }]} placeholder="0.00" placeholderTextColor={colors.textSecondary} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
          </View>
        </View>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>分类</Text>
          <CategoryPicker type={type} selectedCategory={selectedCategory.name} onSelect={(cat) => setSelectedCategory(cat)} />
        </View>
        <TouchableOpacity style={[styles.accountSelector, { backgroundColor: colors.card }]} onPress={() => setShowAccountPicker(!showAccountPicker)}>
          <Text style={[styles.accountLabel, { color: colors.textSecondary }]}>账户</Text>
          <View style={styles.accountValue}>
            <Text style={[styles.accountName, { color: colors.text }]}>{selectedAccount?.name || '选择账户'}</Text>
            <ChevronDown size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
        {showAccountPicker && (
          <View style={[styles.accountList, { backgroundColor: colors.card }]}>
            {accounts.map((account) => (
              <TouchableOpacity key={account.id} style={[styles.accountItem, selectedAccountId === account.id && { backgroundColor: colors.primaryLight }]} onPress={() => { setSelectedAccountId(account.id); setShowAccountPicker(false); }}>
                <Text style={[styles.accountItemText, { color: colors.text }]}>{account.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>备注</Text>
          <TextInput style={[styles.descInput, { color: colors.text, borderColor: colors.border }]} placeholder="添加备注..." placeholderTextColor={colors.textSecondary} value={description} onChangeText={setDescription} />
        </View>
      </ScrollView>

      {/* AI 智能输入 Modals */}
      <TextBillInput
        visible={showTextInput}
        onClose={() => setShowTextInput(false)}
        onComplete={handleAIResult}
      />
      <VoiceBillInput
        visible={showVoiceInput}
        onClose={() => setShowVoiceInput(false)}
        onComplete={handleAIResult}
      />
      <ImageBillInput
        visible={showImageInput}
        onClose={() => setShowImageInput(false)}
        onComplete={handleAIResult}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 17, fontWeight: '600' },
  saveBtn: { fontSize: 15, fontWeight: '600' },
  aiInputSection: { marginHorizontal: 16, borderRadius: 12, padding: 12, marginBottom: 12, marginTop: 8 },
  aiInputTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  aiButtonRow: { flexDirection: 'row', gap: 8 },
  aiButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  aiButtonIcon: { fontSize: 20, marginBottom: 2 },
  aiButtonText: { fontSize: 11, fontWeight: '600', color: '#FFFFFF' },
  typeSelector: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 8 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#F5F5F5' },
  typeText: { fontSize: 15, fontWeight: '500' },
  amountCard: { marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 12 },
  amountLabel: { fontSize: 13, marginBottom: 4 },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  currency: { fontSize: 28, fontWeight: 'bold', marginRight: 6 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: 'bold' },
  section: { marginHorizontal: 16, borderRadius: 12, padding: 14, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  accountSelector: { marginHorizontal: 16, borderRadius: 12, padding: 14, marginBottom: 12 },
  accountLabel: { fontSize: 13, marginBottom: 6 },
  accountValue: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  accountName: { fontSize: 15, fontWeight: '500' },
  accountList: { marginHorizontal: 16, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  accountItem: { padding: 14 },
  accountItemText: { fontSize: 15 },
  descInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 15 },
});