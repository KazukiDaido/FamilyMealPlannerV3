import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchMealAttendances, startRealtimeSync, saveMealAttendance, fetchFamilyMembers } from '../../store/slices/familySlice';
import { MealAttendance, MealType, FamilyMember } from '../../types';

interface ScheduleScreenProps {
  navigation: any;
}

const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    mealAttendances, 
    members, 
    isLoading,
    currentMemberId,
    isConnected,
    lastSyncTime,
    currentFamilyId
  } = useSelector((state: RootState) => state.family);
  // デバッグ用: 強制的に今日の日付を設定（シミュレーターの日付問題を回避）
  const today = new Date();
  console.log('現在の日付:', today.toISOString().split('T')[0]);
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split('T')[0]);
  const [showMonthModal, setShowMonthModal] = useState<boolean>(false);

  // 現在ログインユーザーの情報を取得
  const getCurrentUser = () => {
    return members.find(member => member.id === currentMemberId);
  };

  useEffect(() => {
    console.log('スケジュール画面: useEffect開始', { 
      currentMemberId, 
      currentFamilyId,
      membersCount: members.length 
    });
    dispatch(fetchFamilyMembers());
    dispatch(fetchMealAttendances({ date: selectedDate }));
    
    // リアルタイム同期を開始（家族グループが存在する場合）
    const state = require('../../store').store.getState();
    const currentFamilyGroup = state.familyGroup.currentFamilyGroup;
    if (currentFamilyGroup?.id) {
      console.log('スケジュール画面: リアルタイム同期を開始:', currentFamilyGroup.id);
      dispatch(startRealtimeSync(currentFamilyGroup.id));
    }
  }, [dispatch, selectedDate]);

  // 食事参加データの変更を監視
  useEffect(() => {
    console.log('スケジュール画面: 食事参加データ更新:', {
      count: mealAttendances.length,
      data: mealAttendances.map(att => ({
        date: att.date,
        mealType: att.mealType,
        attendees: att.attendees.length
      }))
    });
  }, [mealAttendances]);

  // カレンダー用のマーキングデータを作成（シンプル版）
  const getMarkedDates = () => {
    const markedDates: any = {};
    const today = new Date().toISOString().split('T')[0];
    
    // 食事参加がある日付を薄くマーク
    mealAttendances.forEach((attendance) => {
      const date = attendance.date;
      if (!markedDates[date]) {
        markedDates[date] = { 
          marked: true,
          dotColor: '#E8F5E9',
          selectedDotColor: '#6B7C32'
        };
      }
    });
    
    // 今日の日付をマーク
    if (!markedDates[today]) {
      markedDates[today] = {};
    }
    markedDates[today].marked = true;
    markedDates[today].today = true;
    markedDates[today].todayTextColor = '#6B7C32';
    markedDates[today].todayBackgroundColor = '#E8F5E9';
    
    // 選択された日付をハイライト
    if (selectedDate !== today) {
      markedDates[selectedDate] = {
        selected: true,
        selectedColor: '#6B7C32',
      };
    } else {
      // 今日が選択されている場合は特別なスタイル
      markedDates[today].selected = true;
      markedDates[today].selectedColor = '#6B7C32';
      markedDates[today].selectedTextColor = 'white';
    }
    
    return markedDates;
  };

  // 選択された日付の食事参加状況を取得
  const getSelectedDateAttendances = () => {
    const filtered = mealAttendances.filter(attendance => attendance.date === selectedDate);
    console.log('スケジュール画面: 選択日付の食事参加データ:', {
      selectedDate,
      filteredCount: filtered.length,
      allCount: mealAttendances.length,
      filtered: filtered.map(att => ({
        mealType: att.mealType,
        attendees: att.attendees.length,
        attendeesList: att.attendees
      }))
    });
    return filtered;
  };

  // 代理登録権限をチェックする関数
  const canToggleMemberAttendance = (memberId: string): boolean => {
    console.log('権限チェック:', { currentMemberId, memberId, members: members.length });
    
    if (!currentMemberId) {
      console.log('警告: currentMemberId が設定されていません');
      return false;
    }
    
    // 自分の分は常に操作可能
    if (memberId === currentMemberId) {
      console.log('自分の分なので操作可能');
      return true;
    }
    
    // 現在のユーザーの代理登録権限をチェック
    const currentMember = members.find(member => member.id === currentMemberId);
    console.log('現在のメンバー:', currentMember);
    const hasProxy = currentMember?.isProxy === true;
    console.log('代理登録権限:', hasProxy);
    return hasProxy;
  };

  // 家族メンバーの参加状態を切り替える
  const toggleMemberAttendance = async (mealType: MealType, memberId: string) => {
    if (!currentMemberId) return;
    
    // 代理登録権限をチェック
    if (!canToggleMemberAttendance(memberId)) {
      Alert.alert(
        '権限がありません',
        '他の家族メンバーの参加状態を変更する権限がありません。'
      );
      return;
    }

    // 自分の場合は直接切り替え
    if (memberId === currentMemberId) {
      await performToggle(mealType, memberId);
      return;
    }

    // 他の人の場合は確認ポップアップのみ（PIN認証はログイン時のみ）
    const targetMember = members.find(member => member.id === memberId);
    if (!targetMember) return;

    Alert.alert(
      '代理登録の確認',
      `${targetMember.name}さんの食事参加を変更しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '変更する',
          onPress: () => performToggle(mealType, memberId)
        }
      ]
    );
  };

  // 実際の切り替え処理
  const performToggle = async (mealType: MealType, memberId: string) => {
    try {
      const existingAttendance = mealAttendances.find(
        att => att.date === selectedDate && att.mealType === mealType
      );
      
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
          date: selectedDate,
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


  const mealTypes: { type: MealType; label: string; icon: string; color: string }[] = [
    { type: 'breakfast', label: '朝食', icon: 'sunny-outline', color: '#FFD700' },
    { type: 'lunch', label: '昼食', icon: 'restaurant-outline', color: '#FFA500' },
    { type: 'dinner', label: '夕食', icon: 'moon-outline', color: '#8B4513' },
  ];

  const selectedDateAttendances = getSelectedDateAttendances();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  // 週間カレンダーの日付を取得
  const getWeekDates = (dateString: string) => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    // 日曜日を0として、月曜日を週の開始とする
    const monday = new Date(date);
    // 日曜日の場合は前の週の月曜日を取得
    if (dayOfWeek === 0) {
      monday.setDate(date.getDate() - 6);
    } else {
      monday.setDate(date.getDate() - dayOfWeek + 1);
    }
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(monday);
      weekDate.setDate(monday.getDate() + i);
      weekDates.push(weekDate.toISOString().split('T')[0]);
    }
    return weekDates;
  };

  // 週の移動関数
  const goToPreviousWeek = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 7);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToNextWeek = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 7);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    const today = new Date();
    console.log('今日ボタン: 日付を設定:', today.toISOString().split('T')[0]);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  // 週の範囲をフォーマットする関数
  const formatWeekRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startMonth = start.getMonth() + 1;
    const startDay = start.getDate();
    const endMonth = end.getMonth() + 1;
    const endDay = end.getDate();
    
    if (startMonth === endMonth) {
      return `${startMonth}月${startDay}日 - ${endDay}日`;
    } else {
      return `${startMonth}月${startDay}日 - ${endMonth}月${endDay}日`;
    }
  };

  const weekDates = getWeekDates(selectedDate);
  const weekDayNames = ['月', '火', '水', '木', '金', '土', '日'];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>スケジュールを読み込み中...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>食事スケジュール</Text>
          <View style={styles.syncStatus}>
            <Ionicons
              name={isConnected ? 'cloud-done' : 'cloud-offline'}
              size={16}
              color={isConnected ? '#28a745' : '#dc3545'}
            />
            <Text
              style={[
                styles.syncStatusText,
                { color: isConnected ? '#28a745' : '#dc3545' },
              ]}
            >
              {isConnected ? 'リアルタイム同期中' : 'オフライン'}
            </Text>
          </View>
        </View>
        {lastSyncTime && (
          <Text style={styles.lastSyncText}>
            最終同期: {new Date(lastSyncTime).toLocaleTimeString()}
          </Text>
        )}
        {/* 現在ログインユーザー表示 */}
        {getCurrentUser() && (
          <View style={styles.currentUserContainer}>
            <Ionicons name="person-circle" size={16} color="#6B7C32" />
            <Text style={styles.currentUserText}>
              ログイン中: {getCurrentUser()?.name}
              {getCurrentUser()?.isProxy && ' (代理登録可)'}
            </Text>
          </View>
        )}
        {/* デバッグ情報 */}
        {__DEV__ && (
          <Text style={styles.debugText}>
            現在のメンバーID: {currentMemberId || '未設定'}
          </Text>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* 週間カレンダー */}
        <View style={styles.weekCalendarSection}>
          <View style={styles.weekHeader}>
            <Text style={styles.weekTitle}>週間表示</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.todayButton}
                onPress={goToToday}
              >
                <Ionicons name="today-outline" size={16} color="#6B7C32" />
                <Text style={styles.todayButtonText}>今日</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.monthButton}
                onPress={() => setShowMonthModal(true)}
              >
                <Ionicons name="calendar-outline" size={16} color="#6B7C32" />
                <Text style={styles.monthButtonText}>月表示</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* 週移動ボタン */}
          <View style={styles.weekNavigation}>
            <TouchableOpacity 
              style={styles.weekNavButton}
              onPress={goToPreviousWeek}
            >
              <Ionicons name="chevron-back" size={18} color="#888" />
            </TouchableOpacity>
            
            <Text style={styles.weekRangeText}>
              {formatWeekRange(weekDates[0], weekDates[6])}
            </Text>
            
            <TouchableOpacity 
              style={styles.weekNavButton}
              onPress={goToNextWeek}
            >
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.weekDaysContainer}>
            {weekDates.map((date, index) => {
              const dateObj = new Date(date);
              const dayName = weekDayNames[index];
              const dayNumber = dateObj.getDate();
              const hasMeals = mealAttendances.some(att => att.date === date);
              const isSelected = date === selectedDate;
              const today = new Date();
              const isToday = date === today.toISOString().split('T')[0];
              
              return (
                <TouchableOpacity
                  key={date}
                  style={[
                    styles.weekDayItem,
                    isSelected && styles.selectedWeekDay,
                    isToday && !isSelected && styles.todayWeekDay
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[
                    styles.weekDayName,
                    isSelected && styles.selectedWeekDayText
                  ]}>{dayName}</Text>
                  <Text style={[
                    styles.weekDayNumber,
                    isSelected && styles.selectedWeekDayText
                  ]}>{dayNumber}</Text>
                  {isToday && (
                    <View style={[
                      styles.mealIndicator,
                      isSelected && styles.selectedMealIndicator
                    ]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 選択された日付の詳細 + 食事参加編集 */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>
            {formatDate(selectedDate)}の食事参加
          </Text>
          
          <View style={styles.mealDetails}>
            {mealTypes.map((meal) => {
              // 同じ食事タイプの最新データを取得（createdAtでソート）
              const mealAttendancesList = selectedDateAttendances.filter(att => att.mealType === meal.type);
              const attendance = mealAttendancesList.length > 0 
                ? mealAttendancesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
                : null;
              
              const attendingMembers = attendance ? attendance.attendees : [];
              
              return (
                <View key={meal.type} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <Ionicons name={meal.icon as any} size={22} color={meal.color} />
                    <Text style={styles.mealTitle}>{meal.label}</Text>
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
                              isAttending && styles.toggleSwitchActive,
                              !canToggleMemberAttendance(member.id) && styles.toggleSwitchDisabled
                            ]}
                            onPress={() => {
                              console.log('トグルがタップされました:', { 
                                mealType: meal.type, 
                                memberId: member.id, 
                                memberName: member.name,
                                currentMemberId,
                                canToggle: canToggleMemberAttendance(member.id)
                              });
                              toggleMemberAttendance(meal.type, member.id);
                            }}
                            disabled={!currentMemberId || !canToggleMemberAttendance(member.id)}
                          >
                            <View style={[
                              styles.toggleThumb,
                              isAttending && styles.toggleThumbActive,
                              !canToggleMemberAttendance(member.id) && styles.toggleThumbDisabled
                            ]} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* 月表示モーダル */}
      <Modal
        visible={showMonthModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMonthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>月表示カレンダー</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowMonthModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Calendar
              current={selectedDate}
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
                setShowMonthModal(false);
              }}
              monthFormat={'yyyy年 M月'}
              hideExtraDays={true}
              disableMonthChange={false}
              firstDay={1}
              hideDayNames={false}
              showWeekNumbers={false}
              onPressArrowLeft={(subtractMonth) => subtractMonth()}
              onPressArrowRight={(addMonth) => addMonth()}
              disableArrowLeft={false}
              disableArrowRight={false}
              disableAllTouchEventsForDisabledDays={true}
              enableSwipeMonths={true}
              markingType={'dot'}
              markedDates={getMarkedDates()}
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#6B7C32',
                selectedDayBackgroundColor: '#6B7C32',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#6B7C32',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                arrowColor: '#6B7C32',
                disabledArrowColor: '#d9e1e8',
                monthTextColor: '#6B7C32',
                indicatorColor: '#6B7C32',
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 13,
              }}
            />
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
  lastSyncText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  debugText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  currentUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  currentUserText: {
    fontSize: 14,
    color: '#6B7C32',
    fontWeight: '500',
    marginLeft: 6,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7C32',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  weekCalendarSection: {
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
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  todayButtonText: {
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '500',
    marginLeft: 4,
  },
  monthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  monthButtonText: {
    fontSize: 14,
    color: '#6B7C32',
    fontWeight: '500',
    marginLeft: 4,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  weekNavButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 32,
    minHeight: 32,
  },
  weekRangeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDayItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    minWidth: 40,
  },
  selectedWeekDay: {
    backgroundColor: '#6B7C32',
  },
  todayWeekDay: {
    backgroundColor: '#E8F5E9',
  },
  weekDayName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  weekDayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  selectedWeekDayText: {
    color: 'white',
  },
  mealIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B7C32',
    marginTop: 2,
  },
  selectedMealIndicator: {
    backgroundColor: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  detailSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  mealDetails: {
    gap: 10,
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
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
  toggleSwitchDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.5,
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
  toggleThumbDisabled: {
    backgroundColor: '#e0e0e0',
    opacity: 0.5,
  },
});

export default ScheduleScreen;