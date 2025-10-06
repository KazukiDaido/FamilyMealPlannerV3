import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { registerMealAttendance, fetchFamilyMembers } from '../../store/slices/familySlice';
import { FamilyMember, MealType } from '../../types';

interface RegisterMealScreenProps {
  navigation: any;
  route: {
    params: {
      mealType: MealType;
      date: string;
    };
  };
}

const RegisterMealScreen: React.FC<RegisterMealScreenProps> = ({ navigation, route }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { members } = useSelector((state: RootState) => state.family);
  const { mealType, date } = route.params;
  
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

  useEffect(() => {
    dispatch(fetchFamilyMembers());
  }, [dispatch]);

  const mealTypeLabels = {
    breakfast: '朝食',
    lunch: '昼食',
    dinner: '夕食',
  };

  const toggleAttendee = (memberId: string) => {
    setSelectedAttendees(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleRegister = () => {
    if (selectedAttendees.length === 0) {
      Alert.alert('エラー', '参加者を選択してください。');
      return;
    }

    // 現在のユーザーID（仮）
    const currentUserId = '1'; // 実際のアプリでは認証されたユーザーIDを使用

    dispatch(registerMealAttendance({
      date,
      mealType,
      attendees: selectedAttendees,
      registeredBy: currentUserId,
    }));

    Alert.alert('成功', '食事参加を登録しました！', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{mealTypeLabels[mealType]}の参加登録</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{date}</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>参加者を選択してください</Text>
        
        {members.map((member) => (
          <TouchableOpacity
            key={member.id}
            style={[
              styles.memberCard,
              selectedAttendees.includes(member.id) && styles.selectedMemberCard
            ]}
            onPress={() => toggleAttendee(member.id)}
          >
            <View style={styles.memberInfo}>
              <Ionicons 
                name={member.role === 'parent' ? 'person' : 'person-outline'} 
                size={24} 
                color={selectedAttendees.includes(member.id) ? '#6B7C32' : '#666'} 
              />
              <Text style={[
                styles.memberName,
                selectedAttendees.includes(member.id) && styles.selectedMemberName
              ]}>
                {member.name}
              </Text>
              <Text style={styles.memberRole}>
                {member.role === 'parent' ? '保護者' : '子供'}
              </Text>
            </View>
            
            {selectedAttendees.includes(member.id) && (
              <Ionicons name="checkmark-circle" size={24} color="#6B7C32" />
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
          <Text style={styles.registerButtonText}>参加を登録</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  dateContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  memberCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMemberCard: {
    borderColor: '#6B7C32',
    backgroundColor: '#f8f9fa',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
    marginRight: 8,
  },
  selectedMemberName: {
    color: '#6B7C32',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
  },
  registerButton: {
    backgroundColor: '#6B7C32',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default RegisterMealScreen;

