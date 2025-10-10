import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchFamilyMembers, saveMealAttendance, setMealAttendances } from '../../store/slices/familySlice';
import { FamilyMember, MealType, MealAttendance } from '../../types';

interface PersonalResponseScreenProps {
  navigation: any;
}

const PersonalResponseScreen: React.FC<PersonalResponseScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { members, currentMemberId, mealAttendances } = useSelector((state: RootState) => state.family);
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 選択状態を管理: { [mealType]: { [memberId]: boolean } }
  const [selections, setSelections] = useState<{ [key in MealType]: { [memberId: string]: boolean } }>({
    breakfast: {},
    lunch: {},
    dinner: {}
  });

  useEffect(() => {
    dispatch(fetchFamilyMembers());
  }, [dispatch]);

  const currentMember = members.find(m => m.id === currentMemberId);

  const mealTypes: { type: MealType; label: string; icon: string }[] = [
    { type: 'breakfast', label: '朝食', icon: 'sunny-outline' },
    { type: 'lunch', label: '昼食', icon: 'restaurant-outline' },
    { type: 'dinner', label: '夕食', icon: 'moon-outline' },
  ];

  // チェックボックスの状態を切り替え
  const toggleSelection = (mealType: MealType, memberId: string) => {
    setSelections(prev => ({
      ...prev,
      [mealType]: {
        ...prev[mealType],
        [memberId]: !prev[mealType][memberId]
      }
    }));
  };

  // 全選択/全解除
  const toggleAllForMeal = (mealType: MealType) => {
    const currentSelections = selections[mealType];
    const allSelected = members.every(member => currentSelections[member.id]);
    
    const newSelections = members.reduce((acc, member) => {
      acc[member.id] = !allSelected; // 全選択されていれば全解除、そうでなければ全選択
      return acc;
    }, {} as { [memberId: string]: boolean });

    setSelections(prev => ({
      ...prev,
      [mealType]: newSelections
    }));
  };

  // 一括登録
  const handleBatchRegistration = async () => {
    const registrations: MealAttendance[] = [];
    
    // 各食事タイプについて選択されたメンバーを処理
    mealTypes.forEach(({ type }) => {
      const selectedMembers = members.filter(member => selections[type][member.id]);
      
      if (selectedMembers.length > 0) {
        // 回答期限を設定（現在時刻から2時間後）
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + 2);
        
        const newAttendance: MealAttendance = {
          id: `meal_${Date.now()}_${type}`,
          date: selectedDate,
          mealType: type,
          attendees: selectedMembers.map(m => m.id),
          registeredBy: currentMemberId!,
          createdAt: new Date().toISOString(),
          deadline: deadline.toISOString(),
          isLocked: false,
          responses: selectedMembers.map(member => ({
            id: `response_${Date.now()}_${member.id}`,
            familyMemberId: member.id,
            date: selectedDate,
            mealType: type,
            willAttend: true,
            respondedAt: new Date().toISOString(),
          })),
        };
        
        registrations.push(newAttendance);
      }
    });

    if (registrations.length === 0) {
      Alert.alert('選択してください', '参加予定を選択してください');
      return;
    }

    try {
      // すべての登録を並行して実行
      await Promise.all(registrations.map(attendance => 
        dispatch(saveMealAttendance(attendance)).unwrap()
      ));
      
      const totalRegistrations = registrations.reduce((sum, reg) => sum + reg.attendees.length, 0);
      Alert.alert('登録完了', `${totalRegistrations}件の参加予定を登録しました`);
      
      // 選択状態をリセット
      setSelections({
        breakfast: {},
        lunch: {},
        dinner: {}
      });
      
    } catch (error) {
      console.error('一括登録に失敗:', error);
      Alert.alert('エラー', '参加予定の登録に失敗しました');
    }
  };

  const handleBackToHome = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToHome} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>参加予定を回答</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {currentMember?.name || 'ユーザー'}さん、今日の食事参加予定を選択してください
          </Text>
          <Text style={styles.dateText}>{selectedDate}</Text>
        </View>

        {/* 食事タイプごとの選択セクション */}
        {mealTypes.map(({ type, label, icon }) => {
          const selectedCount = members.filter(member => selections[type][member.id]).length;
          const allSelected = members.length > 0 && selectedCount === members.length;
          
          return (
            <View key={type} style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <View style={styles.mealTitleContainer}>
                  <Ionicons name={icon as any} size={24} color="#6B7C32" />
                  <Text style={styles.mealTitle}>{label}</Text>
                  <Text style={styles.selectedCount}>({selectedCount}/{members.length})</Text>
                </View>
                <TouchableOpacity
                  style={styles.selectAllButton}
                  onPress={() => toggleAllForMeal(type)}
                >
                  <Ionicons 
                    name={allSelected ? "checkbox" : "square-outline"} 
                    size={20} 
                    color={allSelected ? "#6B7C32" : "#999"} 
                  />
                  <Text style={[styles.selectAllText, allSelected && styles.selectAllTextActive]}>
                    {allSelected ? "全解除" : "全選択"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.memberGrid}>
                {members.map((member) => {
                  const isSelected = selections[type][member.id];
                  return (
                    <TouchableOpacity
                      key={member.id}
                      style={[styles.memberCard, isSelected && styles.selectedMemberCard]}
                      onPress={() => toggleSelection(type, member.id)}
                    >
                      <Ionicons 
                        name={isSelected ? "checkbox" : "square-outline"} 
                        size={20} 
                        color={isSelected ? "#6B7C32" : "#999"} 
                      />
                      <Text style={[styles.memberName, isSelected && styles.selectedMemberName]}>
                        {member.name}
                      </Text>
                      {member.isProxy && (
                        <Ionicons name="person-add" size={16} color="#FF9500" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* 一括登録ボタン */}
        <TouchableOpacity
          style={styles.batchRegisterButton}
          onPress={handleBatchRegistration}
        >
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text style={styles.batchRegisterButtonText}>選択した参加予定を登録</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  mealSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  selectAllText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  selectAllTextActive: {
    color: '#6B7C32',
    fontWeight: '600',
  },
  memberGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: '45%',
    flex: 1,
  },
  selectedMemberCard: {
    backgroundColor: '#E8F5E8',
    borderColor: '#6B7C32',
  },
  memberName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  selectedMemberName: {
    color: '#6B7C32',
    fontWeight: '600',
  },
  batchRegisterButton: {
    backgroundColor: '#6B7C32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#6B7C32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  batchRegisterButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PersonalResponseScreen;
