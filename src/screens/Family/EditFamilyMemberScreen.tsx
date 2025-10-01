import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { updateFamilyMember, fetchFamilyMembers, deleteFamilyMember } from '../../store/slices/familySlice';
import { FamilyMember, FamilyMemberRole } from '../../types';

interface EditFamilyMemberScreenProps {
  navigation: any;
  route: any;
}

const EditFamilyMemberScreen: React.FC<EditFamilyMemberScreenProps> = ({ navigation, route }) => {
  const { memberId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { members, isLoading } = useSelector((state: RootState) => state.family);
  
  const [name, setName] = useState('');
  const [role, setRole] = useState<FamilyMemberRole>('child');
  const [isProxy, setIsProxy] = useState(false);

  const member = members.find(m => m.id === memberId);

  useEffect(() => {
    if (member) {
      setName(member.name);
      setRole(member.role);
      setIsProxy(member.isProxy);
    }
  }, [member]);

  const handleUpdateFamilyMember = () => {
    if (!name.trim()) {
      Alert.alert('入力エラー', '名前は必須です。');
      return;
    }

    if (!member) {
      Alert.alert('エラー', 'メンバーが見つかりません。');
      return;
    }

    const updatedMember: FamilyMember = {
      ...member,
      name: name.trim(),
      role,
      isProxy,
    };

    dispatch(updateFamilyMember(updatedMember));
    Alert.alert('成功', '家族メンバーが更新されました！');
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      '削除確認',
      `${member?.name}を削除しますか？この操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteFamilyMember(memberId));
            Alert.alert('削除', '家族メンバーを削除しました。');
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!member) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={60} color="#D9534F" />
        <Text style={styles.errorText}>メンバーが見つかりません</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>家族メンバーを編集</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={24} color="#D9534F" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.formContainer}>
        <Text style={styles.label}>名前</Text>
        <TextInput
          style={styles.input}
          placeholder="例: 山田 太郎"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>役割</Text>
        <View style={styles.roleSelector}>
          {['parent', 'child'].map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleButton, role === r && styles.selectedRoleButton]}
              onPress={() => setRole(r as FamilyMemberRole)}
            >
              <Text style={[styles.roleButtonText, role === r && styles.selectedRoleButtonText]}>
                {r === 'parent' ? '保護者' : '子供'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>代理登録を許可</Text>
          <Switch
            onValueChange={setIsProxy}
            value={isProxy}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isProxy ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>
        <Text style={styles.hintText}>
          代理登録を許可すると、このメンバーが他の家族メンバーの食事参加を登録できるようになります。
        </Text>

        <TouchableOpacity 
          style={[styles.updateButton, isLoading && styles.disabledButton]} 
          onPress={handleUpdateFamilyMember}
          disabled={isLoading}
        >
          <Text style={styles.updateButtonText}>
            {isLoading ? '更新中...' : '更新'}
          </Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteButton: {
    padding: 5,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  selectedRoleButton: {
    backgroundColor: '#6B7C32',
  },
  roleButtonText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
  },
  selectedRoleButtonText: {
    color: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  hintText: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    textAlign: 'center',
  },
  updateButton: {
    backgroundColor: '#6B7C32',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#D9534F',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditFamilyMemberScreen;
