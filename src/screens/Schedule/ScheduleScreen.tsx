import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchMealAttendances } from '../../store/slices/familySlice';
import { MealAttendance, MealType, FamilyMember } from '../../types';

interface ScheduleScreenProps {
  navigation: any;
}

const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { mealAttendances, members, isLoading } = useSelector((state: RootState) => state.family);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showMonthModal, setShowMonthModal] = useState<boolean>(false);

  useEffect(() => {
    dispatch(fetchMealAttendances());
  }, [dispatch]);

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
    return mealAttendances.filter(attendance => attendance.date === selectedDate);
  };

  // 家族メンバーの参加状況を取得
  const getMemberAttendanceStatus = (memberId: string, mealType: MealType) => {
    const attendance = mealAttendances.find(
      att => att.date === selectedDate && att.mealType === mealType
    );
    return attendance ? attendance.attendees.includes(memberId) : false;
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
    setSelectedDate(new Date().toISOString().split('T')[0]);
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
        <Text style={styles.headerTitle}>食事スケジュール</Text>
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
              const isToday = date === new Date().toISOString().split('T')[0];
              
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
                  {hasMeals && (
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

        {/* 選択された日付の詳細 */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>
            {formatDate(selectedDate)}の食事参加状況
          </Text>
          
          {selectedDateAttendances.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>この日の食事参加データはありません</Text>
            </View>
          ) : (
            <View style={styles.mealDetails}>
              {mealTypes.map((meal) => {
                const attendance = selectedDateAttendances.find(att => att.mealType === meal.type);
                return (
                  <View key={meal.type} style={styles.mealDetailCard}>
                    <View style={styles.mealDetailHeader}>
                      <Ionicons name={meal.icon as any} size={20} color={meal.color} />
                      <Text style={styles.mealDetailTitle}>{meal.label}</Text>
                    </View>
                    
                    {attendance ? (
                      <View style={styles.attendeesList}>
                        {members.map((member) => {
                          const isAttending = attendance.attendees.includes(member.id);
                          return (
                            <View key={member.id} style={styles.attendeeItem}>
                              <Text style={styles.attendeeName}>{member.name}</Text>
                              <Ionicons
                                name={isAttending ? 'checkmark-circle' : 'close-circle'}
                                size={16}
                                color={isAttending ? '#34C759' : '#FF3B30'}
                              />
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={styles.noAttendanceText}>参加データなし</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
    backgroundColor: '#E8F5E9',
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
    gap: 15,
  },
  mealDetailCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  mealDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  attendeesList: {
    gap: 8,
  },
  attendeeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  attendeeName: {
    fontSize: 14,
    color: '#333',
  },
  noAttendanceText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default ScheduleScreen;