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
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');

  useEffect(() => {
    dispatch(fetchMealAttendances());
  }, [dispatch]);

  // カレンダー用のマーキングデータを作成
  const getMarkedDates = () => {
    const markedDates: any = {};
    
    mealAttendances.forEach((attendance) => {
      const date = attendance.date;
      if (!markedDates[date]) {
        markedDates[date] = { marked: true, dots: [] };
      }
      
      // 食事タイプに応じて色分け
      const colors = {
        breakfast: '#FFD700', // 金色
        lunch: '#FFA500',     // オレンジ
        dinner: '#8B4513',    // 茶色
      };
      
      markedDates[date].dots.push({
        color: colors[attendance.mealType],
        selectedDotColor: colors[attendance.mealType],
      });
    });
    
    // 選択された日付をハイライト
    if (markedDates[selectedDate]) {
      markedDates[selectedDate].selected = true;
      markedDates[selectedDate].selectedColor = '#6B7C32';
    } else {
      markedDates[selectedDate] = {
        selected: true,
        selectedColor: '#6B7C32',
      };
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

  // 統計情報を計算
  const getStatistics = () => {
    const totalMeals = mealAttendances.length;
    const totalPossibleAttendances = members.length * 3 * 30; // 仮に30日間として計算
    const totalAttendances = mealAttendances.reduce((sum, att) => sum + att.attendees.length, 0);
    
    return {
      totalMeals,
      totalAttendances,
      averageAttendance: totalMeals > 0 ? Math.round((totalAttendances / (totalMeals * members.length)) * 100) : 0,
    };
  };

  const mealTypes: { type: MealType; label: string; icon: string; color: string }[] = [
    { type: 'breakfast', label: '朝食', icon: 'sunny-outline', color: '#FFD700' },
    { type: 'lunch', label: '昼食', icon: 'restaurant-outline', color: '#FFA500' },
    { type: 'dinner', label: '夕食', icon: 'moon-outline', color: '#8B4513' },
  ];

  const statistics = getStatistics();
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
        <View style={styles.viewModeButtons}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'month' && styles.activeViewModeButton]}
            onPress={() => setViewMode('month')}
          >
            <Text style={[styles.viewModeButtonText, viewMode === 'month' && styles.activeViewModeButtonText]}>
              月
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'week' && styles.activeViewModeButton]}
            onPress={() => setViewMode('week')}
          >
            <Text style={[styles.viewModeButtonText, viewMode === 'week' && styles.activeViewModeButtonText]}>
              週
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* 統計情報 */}
        <View style={styles.statisticsSection}>
          <Text style={styles.sectionTitle}>統計情報</Text>
          <View style={styles.statisticsGrid}>
            <View style={styles.statisticsItem}>
              <Text style={styles.statisticsNumber}>{statistics.totalMeals}</Text>
              <Text style={styles.statisticsLabel}>登録された食事</Text>
            </View>
            <View style={styles.statisticsItem}>
              <Text style={styles.statisticsNumber}>{statistics.totalAttendances}</Text>
              <Text style={styles.statisticsLabel}>総参加回数</Text>
            </View>
            <View style={styles.statisticsItem}>
              <Text style={styles.statisticsNumber}>{statistics.averageAttendance}%</Text>
              <Text style={styles.statisticsLabel}>平均参加率</Text>
            </View>
          </View>
        </View>

        {/* カレンダー */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>カレンダー</Text>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => setSelectedDate(day.dateString)}
            monthFormat={'yyyy年 M月'}
            hideExtraDays={true}
            disableMonthChange={false}
            firstDay={1}
            hideDayNames={viewMode === 'week'}
            showWeekNumbers={false}
            onPressArrowLeft={(subtractMonth) => subtractMonth()}
            onPressArrowRight={(addMonth) => addMonth()}
            disableArrowLeft={false}
            disableArrowRight={false}
            disableAllTouchEventsForDisabledDays={true}
            enableSwipeMonths={true}
            markingType={'multi-dot'}
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
              dotColor: '#00adf5',
              selectedDotColor: '#ffffff',
              arrowColor: '#6B7C32',
              disabledArrowColor: '#d9e1e8',
              monthTextColor: '#6B7C32',
              indicatorColor: '#6B7C32',
              textDayFontWeight: '300',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '300',
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 13,
            }}
          />
          
          {/* 凡例 */}
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>凡例</Text>
            <View style={styles.legendItems}>
              {mealTypes.map((meal) => (
                <View key={meal.type} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: meal.color }]} />
                  <Text style={styles.legendText}>{meal.label}</Text>
                </View>
              ))}
            </View>
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
  viewModeButtons: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeViewModeButton: {
    backgroundColor: '#6B7C32',
  },
  viewModeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeViewModeButtonText: {
    color: 'white',
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
  statisticsSection: {
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
  statisticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statisticsItem: {
    alignItems: 'center',
  },
  statisticsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B7C32',
    marginBottom: 5,
  },
  statisticsLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  calendarSection: {
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
  legend: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
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