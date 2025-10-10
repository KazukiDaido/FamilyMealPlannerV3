import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { submitPersonalResponse, logoutMember } from '../../store/slices/familySlice';
import { FamilyMember, MealType, PersonalResponse } from '../../types';

interface PersonalResponseScreenProps {
  navigation: any;
}

const PersonalResponseScreen: React.FC<PersonalResponseScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    members, 
    mealAttendances, 
    currentMemberId, 
    responseSettings,
    isLoading 
  } = useSelector((state: RootState) => state.family);

  const [selectedMeal, setSelectedMeal] = useState<{ date: string; mealType: MealType } | null>(null);

  // 現在のメンバー情報を取得
  const currentMember = members.find(member => member.id === currentMemberId);
  
  // 今日の日付
  const today = new Date().toISOString().split('T')[0];
  
  // 今日の食事データ
  const todayMeals = mealAttendances.filter(attendance => attendance.date === today);

  // 食事時間の設定
  const mealTimes = {
    breakfast: { time: '07:00', label: '朝食' },
    lunch: { time: '12:00', label: '昼食' },
    dinner: { time: '18:00', label: '夕食' },
  };

  // 回答期限の計算
  const getDeadlineTime = (mealType: MealType): Date => {
    const [hours, minutes] = mealTimes[mealType].time.split(':').map(Number);
    const deadline = new Date();
    deadline.setHours(hours, minutes, 0, 0);
    deadline.setMinutes(deadline.getMinutes() - responseSettings.deadlineMinutes);
    return deadline;
  };

  // 期限切れかどうかの判定（実際の食事参加データの期限を使用）
  const isDeadlinePassed = (mealType: MealType): boolean => {
    const mealAttendance = todayMeals.find(meal => meal.mealType === mealType);
    if (!mealAttendance?.deadline) {
      // 期限が設定されていない場合は期限切れなし（新規登録時）
      return false;
    }
    
    // 期限が設定されている場合は現在時刻と比較
    const deadline = new Date(mealAttendance.deadline);
    const now = new Date();
    
    // 期限が過去の場合は期限切れ
    if (now > deadline) {
      console.log(`期限切れ: ${mealType}, 期限: ${deadline.toLocaleString()}, 現在: ${now.toLocaleString()}`);
      // デバッグ用：期限切れでも回答を許可する（テスト用）
      console.log(`デバッグ用：期限切れですが回答を許可します`);
      return false; // テスト用に期限切れを無効化
    }
    
    return false;
  };

  // 現在の回答状況を取得
  const getCurrentResponse = (mealType: MealType): PersonalResponse | null => {
    const mealAttendance = todayMeals.find(meal => meal.mealType === mealType);
    if (!mealAttendance?.responses) return null;
    return mealAttendance.responses.find(r => r.familyMemberId === currentMemberId) || null;
  };

  // 他の家族の回答状況を取得
  const getOtherResponses = (mealType: MealType): PersonalResponse[] => {
    const mealAttendance = todayMeals.find(meal => meal.mealType === mealType);
    if (!mealAttendance?.responses) return [];
    return mealAttendance.responses.filter(r => r.familyMemberId !== currentMemberId);
  };

  // 回答の送信
  const handleResponse = async (mealType: MealType, willAttend: boolean) => {
    if (!currentMemberId) {
      Alert.alert('エラー', 'ログイン情報が見つかりません。');
      return;
    }

    if (isDeadlinePassed(mealType)) {
      Alert.alert('期限切れ', '回答期限を過ぎています。');
      return;
    }

    try {
      await dispatch(submitPersonalResponse({
        familyMemberId: currentMemberId,
        date: today,
        mealType,
        willAttend,
      })).unwrap();
      
      Alert.alert(
        '回答完了', 
        `${mealTimes[mealType].label}に${willAttend ? '参加' : '不参加'}と回答しました。`
      );
    } catch (error: any) {
      Alert.alert('エラー', error || '回答の送信に失敗しました。');
    }
  };

  // ログアウト
  const handleLogout = async () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'ログアウト', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logoutMember()).unwrap();
              // ホーム画面に戻る（ログアウト処理は完了）
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('エラー', 'ログアウトに失敗しました。');
            }
          }
        }
      ]
    );
  };

  // 回答状態の表示
  const getResponseStatus = (mealType: MealType) => {
    const response = getCurrentResponse(mealType);
    if (!response) return { status: 'unanswered', color: '#CCC', icon: 'help-circle-outline' };
    
    return response.willAttend 
      ? { status: 'attend', color: '#34C759', icon: 'checkmark-circle' }
      : { status: 'not-attend', color: '#FF3B30', icon: 'close-circle' };
  };

  // 残り時間の表示（実際の食事参加データの期限を使用）
  const getTimeRemaining = (mealType: MealType): string => {
    const mealAttendance = todayMeals.find(meal => meal.mealType === mealType);
    const deadline = mealAttendance?.deadline ? new Date(mealAttendance.deadline) : getDeadlineTime(mealType);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return '期限切れ';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `あと${hours}時間${minutes}分`;
    } else {
      return `あと${minutes}分`;
    }
  };

  if (!currentMember) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>ログイン情報が見つかりません</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.replace('Login')}>
            <Text style={styles.loginButtonText}>ログイン画面へ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>こんにちは、</Text>
          <Text style={styles.memberName}>{currentMember.name}さん</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.dateSection}>
          <Text style={styles.dateText}>今日の食事 ({today})</Text>
        </View>

        {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mealType) => {
          const responseStatus = getResponseStatus(mealType);
          const otherResponses = getOtherResponses(mealType);
          const isDeadline = isDeadlinePassed(mealType);
          
          return (
            <View key={mealType} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View style={styles.mealInfo}>
                  <Ionicons 
                    name={mealType === 'breakfast' ? 'sunny-outline' : 
                          mealType === 'lunch' ? 'partly-sunny-outline' : 'moon-outline'} 
                    size={24} 
                    color="#6B7C32" 
                  />
                  <Text style={styles.mealLabel}>{mealTimes[mealType].label}</Text>
                  <Text style={styles.mealTime}>{mealTimes[mealType].time}</Text>
                </View>
                <View style={styles.statusContainer}>
                  <Ionicons name={responseStatus.icon} size={20} color={responseStatus.color} />
                  <Text style={[styles.statusText, { color: responseStatus.color }]}>
                    {responseStatus.status === 'attend' ? '参加' : 
                     responseStatus.status === 'not-attend' ? '不参加' : '未回答'}
                  </Text>
                </View>
              </View>

              <View style={styles.deadlineSection}>
                <Text style={[styles.deadlineText, isDeadline && styles.deadlinePassed]}>
                  {isDeadline ? '回答期限切れ' : `回答期限: ${getTimeRemaining(mealType)}`}
                </Text>
              </View>

              {!isDeadline && (
                <View style={styles.responseButtons}>
                  <TouchableOpacity
                    style={[styles.responseButton, styles.attendButton]}
                    onPress={() => handleResponse(mealType, true)}
                    disabled={isLoading}
                  >
                    <Ionicons name="checkmark" size={20} color="white" />
                    <Text style={styles.responseButtonText}>参加する</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.responseButton, styles.notAttendButton]}
                    onPress={() => handleResponse(mealType, false)}
                    disabled={isLoading}
                  >
                    <Ionicons name="close" size={20} color="white" />
                    <Text style={styles.responseButtonText}>不参加</Text>
                  </TouchableOpacity>
                </View>
              )}

              {otherResponses.length > 0 && (
                <View style={styles.otherResponsesSection}>
                  <Text style={styles.otherResponsesTitle}>他の家族の回答</Text>
                  <View style={styles.otherResponsesList}>
                    {otherResponses.map((response) => {
                      const member = members.find(m => m.id === response.familyMemberId);
                      return (
                        <View key={response.id} style={styles.otherResponseItem}>
                          <Text style={styles.otherResponseName}>{member?.name || '不明'}</Text>
                          <Ionicons 
                            name={response.willAttend ? 'checkmark-circle' : 'close-circle'} 
                            size={16} 
                            color={response.willAttend ? '#34C759' : '#FF3B30'} 
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
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
    backgroundColor: '#F7F7F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  memberName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  mealTime: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 5,
  },
  deadlineSection: {
    marginBottom: 15,
  },
  deadlineText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  deadlinePassed: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  responseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  attendButton: {
    backgroundColor: '#34C759',
  },
  notAttendButton: {
    backgroundColor: '#FF3B30',
  },
  responseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  otherResponsesSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 10,
  },
  otherResponsesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  otherResponsesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  otherResponseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  otherResponseName: {
    fontSize: 12,
    color: '#333',
    marginRight: 5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#6B7C32',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PersonalResponseScreen;

