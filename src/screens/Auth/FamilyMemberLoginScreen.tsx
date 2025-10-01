import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { loginAsMember } from '../../store/slices/familySlice';
import { FamilyMember } from '../../types';

interface FamilyMemberLoginScreenProps {
  navigation: any;
}

const FamilyMemberLoginScreen: React.FC<FamilyMemberLoginScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { members, isLoading } = useSelector((state: RootState) => state.family);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const handleMemberSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
  };

  const handleLogin = async () => {
    if (!selectedMemberId) {
      Alert.alert('エラー', '家族メンバーを選択してください。');
      return;
    }

    try {
      await dispatch(loginAsMember(selectedMemberId)).unwrap();
      Alert.alert('ログイン成功', 'ようこそ！', [
        { text: 'OK', onPress: () => navigation.replace('MainTabs') }
      ]);
    } catch (error: any) {
      Alert.alert('ログインエラー', error || 'ログインに失敗しました。');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'parent':
        return 'person-outline';
      case 'child':
        return 'people-outline';
      default:
        return 'person-circle-outline';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'parent':
        return '#6B7C32';
      case 'child':
        return '#FF9500';
      default:
        return '#007AFF';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'parent':
        return '保護者';
      case 'child':
        return '子ども';
      default:
        return 'メンバー';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>家族メンバーログイン</Text>
        <Text style={styles.headerSubtitle}>あなたは誰ですか？</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.memberList}>
          {members.map((member: FamilyMember) => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.memberCard,
                selectedMemberId === member.id && styles.selectedMemberCard
              ]}
              onPress={() => handleMemberSelect(member.id)}
            >
              <View style={styles.memberInfo}>
                <View style={[styles.roleIcon, { backgroundColor: getRoleColor(member.role) + '20' }]}>
                  <Ionicons 
                    name={getRoleIcon(member.role)} 
                    size={24} 
                    color={getRoleColor(member.role)} 
                  />
                </View>
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={[styles.memberRole, { color: getRoleColor(member.role) }]}>
                    {getRoleLabel(member.role)}
                  </Text>
                </View>
              </View>
              {selectedMemberId === member.id && (
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark-circle" size={24} color="#6B7C32" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.loginButton,
            (!selectedMemberId || isLoading) && styles.disabledButton
          ]}
          onPress={handleLogin}
          disabled={!selectedMemberId || isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Text>
        </TouchableOpacity>

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>💡 使い方</Text>
          <Text style={styles.helpText}>
            ・自分の名前を選択してログインしてください{'\n'}
            ・ログイン後、今日の食事に参加するかどうか回答できます{'\n'}
            ・他の家族の回答状況も確認できます
          </Text>
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
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  memberList: {
    marginBottom: 30,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedMemberCard: {
    borderColor: '#6B7C32',
    backgroundColor: '#F0F8F0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: 10,
  },
  loginButton: {
    backgroundColor: '#6B7C32',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7C32',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default FamilyMemberLoginScreen;
