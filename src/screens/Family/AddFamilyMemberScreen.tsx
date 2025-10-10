import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { addFamilyMember } from '../../store/slices/familySlice';
import { FamilyRole } from '../../types';

interface AddFamilyMemberScreenProps {
  navigation: any;
}

const AddFamilyMemberScreen: React.FC<AddFamilyMemberScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState('');
  const [role, setRole] = useState<FamilyRole>('child');
  const [isProxy, setIsProxy] = useState(false);

  const handleAddMember = () => {
    if (!name.trim()) {
      Alert.alert('入力エラー', '名前を入力してください。');
      return;
    }

    dispatch(addFamilyMember({
      name: name.trim(),
      role,
      isProxy,
    }));

    Alert.alert('成功', '家族メンバーを追加しました！', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>家族メンバー追加</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.formContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本情報</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>名前</Text>
            <TextInput
              style={styles.input}
              placeholder="例: 太郎"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>役割</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'parent' && styles.selectedRoleButton]}
                onPress={() => setRole('parent')}
              >
                <Ionicons 
                  name="person" 
                  size={20} 
                  color={role === 'parent' ? 'white' : '#6B7C32'} 
                />
                <Text style={[
                  styles.roleButtonText, 
                  role === 'parent' && styles.selectedRoleButtonText
                ]}>
                  保護者
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.roleButton, role === 'child' && styles.selectedRoleButton]}
                onPress={() => setRole('child')}
              >
                <Ionicons 
                  name="person-outline" 
                  size={20} 
                  color={role === 'child' ? 'white' : '#6B7C32'} 
                />
                <Text style={[
                  styles.roleButtonText, 
                  role === 'child' && styles.selectedRoleButtonText
                ]}>
                  子供
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>権限設定</Text>
          
          <TouchableOpacity 
            style={styles.permissionItem}
            onPress={() => setIsProxy(!isProxy)}
          >
            <View style={styles.permissionInfo}>
              <Ionicons name="people-outline" size={20} color="#6B7C32" />
              <View style={styles.permissionText}>
                <Text style={styles.permissionTitle}>代理登録権限</Text>
                <Text style={styles.permissionDescription}>
                  他の家族メンバーの食事参加を登録できます
                </Text>
              </View>
            </View>
            <View style={[styles.checkbox, isProxy && styles.checkedBox]}>
              {isProxy && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddMember}>
          <Text style={styles.addButtonText}>家族メンバーを追加</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6B7C32',
    backgroundColor: 'white',
  },
  selectedRoleButton: {
    backgroundColor: '#6B7C32',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7C32',
    marginLeft: 8,
  },
  selectedRoleButtonText: {
    color: 'white',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  permissionText: {
    marginLeft: 12,
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6B7C32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#6B7C32',
  },
  addButton: {
    backgroundColor: '#6B7C32',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AddFamilyMemberScreen;


