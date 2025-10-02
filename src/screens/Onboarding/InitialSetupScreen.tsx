import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { addFamilyMember, loginAsMember } from '../../store/slices/familySlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface InitialSetupScreenProps {
  navigation: any;
}

const InitialSetupScreen: React.FC<InitialSetupScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.family);

  const [familyName, setFamilyName] = useState('');
  const [members, setMembers] = useState([
    { name: '', role: 'parent' as 'parent' | 'child', isProxy: true },
    { name: '', role: 'parent' as 'parent' | 'child', isProxy: true },
  ]);

  const handleAddMember = () => {
    setMembers([...members, { name: '', role: 'child', isProxy: false }]);
  };

  const handleRemoveMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const handleMemberChange = (index: number, field: string, value: string | boolean) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const handleComplete = async () => {
    // バリデーション
    if (!familyName.trim()) {
      Alert.alert('エラー', '家族名を入力してください。');
      return;
    }

    const validMembers = members.filter(member => member.name.trim());
    if (validMembers.length === 0) {
      Alert.alert('エラー', '少なくとも1人の家族メンバーを登録してください。');
      return;
    }

    try {
      // 家族メンバーを追加
      let firstMemberId = '';
      for (let i = 0; i < validMembers.length; i++) {
        const member = validMembers[i];
        const result = await dispatch(addFamilyMember({
          name: member.name.trim(),
          role: member.role,
          isProxy: member.isProxy,
        })).unwrap();
        
        // 最初のメンバーをログイン状態にする
        if (i === 0) {
          firstMemberId = result.id;
        }
      }

      // 初回起動フラグを設定
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      await AsyncStorage.setItem('familyName', familyName.trim());

      // 最初のメンバーでログイン
      if (firstMemberId) {
        await dispatch(loginAsMember(firstMemberId)).unwrap();
      }

      Alert.alert(
        'セットアップ完了！',
        `${familyName}の設定が完了しました。`,
        [
          {
            text: 'OK',
            onPress: () => {
              // メイン画面に遷移（App.tsxの認証状態チェックで処理される）
              // navigation.replace('Main');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('エラー', `セットアップに失敗しました: ${error.message || '不明なエラー'}`);
    }
  };

  const renderMemberInput = (member: any, index: number) => (
    <View key={index} style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <Text style={styles.memberLabel}>家族メンバー {index + 1}</Text>
        {members.length > 1 && (
          <TouchableOpacity
            onPress={() => handleRemoveMember(index)}
            style={styles.removeButton}
          >
            <Ionicons name="close-circle" size={24} color="#D9534F" />
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={styles.input}
        placeholder="名前を入力してください"
        value={member.name}
        onChangeText={(value) => handleMemberChange(index, 'name', value)}
      />

      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[
            styles.roleButton,
            member.role === 'parent' && styles.roleButtonActive,
          ]}
          onPress={() => handleMemberChange(index, 'role', 'parent')}
        >
          <Ionicons
            name={member.role === 'parent' ? 'person' : 'person-outline'}
            size={20}
            color={member.role === 'parent' ? 'white' : '#6B7C32'}
          />
          <Text
            style={[
              styles.roleButtonText,
              member.role === 'parent' && styles.roleButtonTextActive,
            ]}
          >
            親
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleButton,
            member.role === 'child' && styles.roleButtonActive,
          ]}
          onPress={() => handleMemberChange(index, 'role', 'child')}
        >
          <Ionicons
            name={member.role === 'child' ? 'person' : 'person-outline'}
            size={20}
            color={member.role === 'child' ? 'white' : '#6B7C32'}
          />
          <Text
            style={[
              styles.roleButtonText,
              member.role === 'child' && styles.roleButtonTextActive,
            ]}
          >
            子
          </Text>
        </TouchableOpacity>
      </View>

      {member.role === 'parent' && (
        <View style={styles.proxyContainer}>
          <TouchableOpacity
            style={styles.proxyButton}
            onPress={() => handleMemberChange(index, 'isProxy', !member.isProxy)}
          >
            <Ionicons
              name={member.isProxy ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={24}
              color={member.isProxy ? '#6B7C32' : '#ccc'}
            />
            <Text style={styles.proxyText}>代理登録可能</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>初期設定</Text>
        <Text style={styles.headerSubtitle}>家族の情報を入力してください</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>家族名</Text>
          <TextInput
            style={styles.input}
            placeholder="例: 田中家"
            value={familyName}
            onChangeText={setFamilyName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>家族メンバー</Text>
            <TouchableOpacity onPress={handleAddMember} style={styles.addButton}>
              <Ionicons name="add-circle" size={24} color="#6B7C32" />
              <Text style={styles.addButtonText}>追加</Text>
            </TouchableOpacity>
          </View>

          {members.map(renderMemberInput)}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
          disabled={isLoading}
        >
          <Text style={styles.completeButtonText}>
            {isLoading ? '設定中...' : '設定を完了'}
          </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  addButtonText: {
    marginLeft: 4,
    color: '#6B7C32',
    fontWeight: '600',
  },
  memberCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  removeButton: {
    padding: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6B7C32',
    backgroundColor: 'white',
  },
  roleButtonActive: {
    backgroundColor: '#6B7C32',
  },
  roleButtonText: {
    marginLeft: 8,
    color: '#6B7C32',
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: 'white',
  },
  proxyContainer: {
    marginTop: 8,
  },
  proxyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  proxyText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  completeButton: {
    backgroundColor: '#6B7C32',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default InitialSetupScreen;
