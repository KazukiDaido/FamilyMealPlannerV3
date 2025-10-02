import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface OnboardingScreenProps {
  navigation: any;
}

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: '家族の食事参加を\n簡単に管理',
    description: '朝食、昼食、夕食の参加者を\n家族みんなで共有できます',
    icon: 'restaurant-outline',
    color: '#6B7C32',
  },
  {
    id: 2,
    title: '家族メンバーを\n自由に追加',
    description: 'お父さん、お母さん、お子さん\n誰でも簡単に登録できます',
    icon: 'people-outline',
    color: '#007AFF',
  },
  {
    id: 3,
    title: 'スケジュールを\nカレンダーで確認',
    description: '過去の食事参加履歴を\nカレンダーで一目で確認',
    icon: 'calendar-outline',
    color: '#FF6B6B',
  },
  {
    id: 4,
    title: '通知で忘れずに',
    description: '食事時間前に通知で\n参加予定を確認できます',
    icon: 'notifications-outline',
    color: '#4ECDC4',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(currentIndex + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      // 最後のスライドの場合は初期設定画面に遷移
      navigation.replace('InitialSetup');
    }
  };

  const handleSkip = () => {
    navigation.replace('InitialSetup');
  };

  const renderSlide = (item: typeof onboardingData[0]) => (
    <Animated.View style={[styles.slide, { opacity: fadeAnim }]} key={item.id}>
      <View style={styles.iconContainer}>
        <View style={[styles.iconBackground, { backgroundColor: item.color }]}>
          <Ionicons name={item.icon as any} size={80} color="white" />
        </View>
      </View>
      
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </Animated.View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {onboardingData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === currentIndex ? '#6B7C32' : '#E0E0E0',
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>スキップ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {renderSlide(onboardingData[currentIndex])}
      </View>

      <View style={styles.footer}>
        {renderDots()}
        
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === onboardingData.length - 1 ? '始める' : '次へ'}
          </Text>
          <Ionicons 
            name={currentIndex === onboardingData.length - 1 ? 'checkmark' : 'arrow-forward'} 
            size={20} 
            color="white" 
            style={styles.nextIcon}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    backgroundColor: '#6B7C32',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextIcon: {
    marginLeft: 8,
  },
});

export default OnboardingScreen;
