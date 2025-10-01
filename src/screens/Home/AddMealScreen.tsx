import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { addMeal } from '../../store/slices/mealSlice';

interface AddMealScreenProps {
  navigation: any;
}

const AddMealScreen: React.FC<AddMealScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD形式
    type: 'breakfast' as 'breakfast' | 'lunch' | 'dinner',
    ingredients: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // バリデーション
    if (!formData.name.trim()) {
      Alert.alert('エラー', '食事名を入力してください');
      return;
    }

    if (!formData.date) {
      Alert.alert('エラー', '日付を選択してください');
      return;
    }

    setIsSubmitting(true);

    try {
      // 材料を配列に変換
      const ingredients = formData.ingredients
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      // 食事データを作成
      const mealData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        date: formData.date,
        type: formData.type,
        ingredients,
      };

      // Reduxアクションをディスパッチ
      await dispatch(addMeal(mealData)).unwrap();

      // 成功メッセージ
      Alert.alert(
        '成功',
        '食事を追加しました',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('エラー', '食事の追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mealTypes = [
    { key: 'breakfast', label: '朝食', icon: 'sunny-outline' },
    { key: 'lunch', label: '昼食', icon: 'partly-sunny-outline' },
    { key: 'dinner', label: '夕食', icon: 'moon-outline' },
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.title}>食事を追加</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 食事名 */}
        <View style={styles.section}>
          <Text style={styles.label}>食事名 *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(value) => handleInputChange('name', value)}
            placeholder="例: 朝食セット"
            maxLength={50}
          />
        </View>

        {/* 日付 */}
        <View style={styles.section}>
          <Text style={styles.label}>日付 *</Text>
          <TextInput
            style={styles.input}
            value={formData.date}
            onChangeText={(value) => handleInputChange('date', value)}
            placeholder="YYYY-MM-DD"
          />
        </View>

        {/* 食事タイプ */}
        <View style={styles.section}>
          <Text style={styles.label}>食事タイプ *</Text>
          <View style={styles.typeContainer}>
            {mealTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeButton,
                  formData.type === type.key && styles.typeButtonActive,
                ]}
                onPress={() => handleInputChange('type', type.key)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={20}
                  color={formData.type === type.key ? 'white' : '#6B7C32'}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    formData.type === type.key && styles.typeButtonTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 説明 */}
        <View style={styles.section}>
          <Text style={styles.label}>説明</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="食事の詳細を入力してください"
            multiline
            numberOfLines={4}
            maxLength={200}
          />
        </View>

        {/* 材料 */}
        <View style={styles.section}>
          <Text style={styles.label}>材料</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.ingredients}
            onChangeText={(value) => handleInputChange('ingredients', value)}
            placeholder="材料をカンマ区切りで入力（例: パン, バター, コーヒー）"
            multiline
            numberOfLines={3}
            maxLength={300}
          />
        </View>

        {/* 送信ボタン */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? '追加中...' : '食事を追加'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2D3748',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6B7C32',
    backgroundColor: 'white',
  },
  typeButtonActive: {
    backgroundColor: '#6B7C32',
  },
  typeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7C32',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#6B7C32',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddMealScreen;
