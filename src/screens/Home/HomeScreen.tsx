import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchFamilyMembers, fetchMealAttendances, saveMealAttendance } from '../../store/slices/familySlice';
import { FamilyMember, MealAttendance, MealType } from '../../types';

interface HomeScreenProps {
  navigation: any;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    members, 
    mealAttendances, 
    isLoading, 
    currentMemberId,
    isConnected,
    lastSyncTime,
    currentFamilyId
  } = useSelector((state: RootState) => state.family);
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    dispatch(fetchFamilyMembers());
    dispatch(fetchMealAttendances({}));
  }, [dispatch]);


  const getAttendanceForMeal = (mealType: MealType) => {
    // 今日の日付で、指定された食事タイプの最新の参加データを取得
    const todayAttendances = mealAttendances.filter(
      attendance => attendance.date === selectedDate && attendance.mealType === mealType
    );
    
    if (todayAttendances.length === 0) {
      return null;
    }
    
    // 最新のデータを取得（createdAtでソート）
    return todayAttendances.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  };

  const getAttendeeNames = (attendees: string[]) => {
    return attendees.map(id => members.find(member => member.id === id)?.name || '不明').join(', ');
  };

  // メンバーの参加状態を切り替える
  const toggleMemberAttendance = async (mealType: MealType, memberId: string) => {
    if (!currentMemberId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const existingAttendance = getAttendanceForMeal(mealType);
      
      let newAttendees: string[];
      
      if (existingAttendance) {
        // 既存の参加データがある場合
        const isCurrentlyAttending = existingAttendance.attendees.includes(memberId);
        newAttendees = isCurrentlyAttending
          ? existingAttendance.attendees.filter(id => id !== memberId)
          : [...existingAttendance.attendees, memberId];
        
        // 既存のデータを更新
        const updatedAttendance: MealAttendance = {
          ...existingAttendance,
          attendees: newAttendees,
          registeredBy: currentMemberId,
        };
        
        dispatch(saveMealAttendance(updatedAttendance));
      } else {
        // 新しい参加データを作成
        newAttendees = [memberId];
        const deadline = new Date();
        deadline.setMinutes(deadline.getMinutes() + 30); // 30分後を期限とする
        
        const newAttendance: MealAttendance = {
          id: `meal_${Date.now()}_${mealType}`,
          date: today,
          mealType,
          attendees: newAttendees,
          registeredBy: currentMemberId,
          createdAt: new Date().toISOString(),
          deadline: deadline.toISOString(),
          isLocked: false,
        };
        
        dispatch(saveMealAttendance(newAttendance));
      }
    } catch (error) {
      console.error('参加状態の切り替えエラー:', error);
      Alert.alert('エラー', '参加状態の更新に失敗しました');
    }
  };


  const mealTypes: { type: MealType; label: string; icon: string }[] = [
    { type: 'breakfast', label: '朝食', icon: 'sunny-outline' },
    { type: 'lunch', label: '昼食', icon: 'restaurant-outline' },
    { type: 'dinner', label: '夕食', icon: 'moon-outline' },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B7C32" />
        <Text style={styles.loadingText}>データを読み込み中...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>今日の食事参加</Text>
          <View style={styles.syncStatus}>
            <Ionicons 
              name={isConnected ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={isConnected ? "#4CAF50" : "#F44336"} 
            />
            <Text style={[styles.syncStatusText, { color: isConnected ? "#4CAF50" : "#F44336" }]}>
              {isConnected ? "リアルタイム同期中" : "オフライン"}
            </Text>
          </View>
        </View>
        <Text style={styles.dateText}>{selectedDate}</Text>
        {lastSyncTime && (
          <Text style={styles.lastSyncText}>
            最終同期: {new Date(lastSyncTime).toLocaleTimeString()}
          </Text>
        )}
      </View>


      <ScrollView style={styles.content}>
        {mealTypes.map(({ type, label, icon }) => {
          const attendance = getAttendanceForMeal(type);
          const attendingMembers = attendance ? attendance.attendees : [];

          return (
            <View key={type} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Ionicons name={icon as any} size={22} color="#6B7C32" />
                <Text style={styles.mealTitle}>{label}</Text>
              </View>

              <View style={styles.membersContainer}>
                {members.map((member) => {
                  const isAttending = attendingMembers.includes(member.id);
                  return (
                    <View key={member.id} style={styles.memberRow}>
                      <View style={styles.memberInfo}>
                        <View style={[
                          styles.memberAvatar,
                          isAttending && styles.memberAvatarAttending
                        ]}>
                          <Text style={[
                            styles.memberAvatarText,
                            isAttending && styles.memberAvatarTextAttending
                          ]}>
                            {member.name.charAt(0)}
                          </Text>
                        </View>
                        <Text style={[
                          styles.memberName,
                          isAttending && styles.memberNameAttending
                        ]}>
                          {member.name}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.toggleSwitch,
                          isAttending && styles.toggleSwitchActive
                        ]}
                        onPress={() => toggleMemberAttendance(type, member.id)}
                        disabled={!currentMemberId}
                      >
                        <View style={[
                          styles.toggleThumb,
                          isAttending && styles.toggleThumbActive
                        ]} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  lastSyncText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  registerButton: {
    padding: 4,
  },
  attendanceInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  attendeeText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  registeredByText: {
    fontSize: 14,
    color: '#666',
  },
  noAttendanceInfo: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
  },
  noAttendanceText: {
    fontSize: 16,
    color: '#856404',
    textAlign: 'center',
  },
  membersContainer: {
    paddingVertical: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarAttending: {
    backgroundColor: '#6B7C32',
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  memberAvatarTextAttending: {
    color: 'white',
  },
  memberName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  memberNameAttending: {
    color: '#6B7C32',
    fontWeight: '600',
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#6B7C32',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});

export default HomeScreen;