import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
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

  useEffect(() => {
    dispatch(fetchMealAttendances());
  }, [dispatch]);

  // カレンダー用のマーキングデータを作成（シンプル版）
  const getMarkedDates = () => {
    const markedDates: any = {};
    
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
    
    // 選択された日付をハイライト
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: '#6B7C32',
    };
    
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
        {/* コンパクトカレンダー */}
        <View style={styles.compactCalendarSection}>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
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
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 11,
              'stylesheet.calendar.header': {
                week: {
                  marginTop: 7,
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  marginBottom: 5,
                }
              },
              'stylesheet.day.basic': {
                base: {
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                today: {
                  backgroundColor: '#6B7C32',
                  borderRadius: 16,
                },
                selected: {
                  backgroundColor: '#6B7C32',
                  borderRadius: 16,
                }
              }
            }}
          />
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
  compactCalendarSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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