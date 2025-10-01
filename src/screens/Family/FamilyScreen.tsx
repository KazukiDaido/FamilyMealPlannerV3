import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchFamilyMembers, addFamilyMember, deleteFamilyMember } from '../../store/slices/familySlice';
import { FamilyMember } from '../../types';

interface FamilyScreenProps {
  navigation: any;
}

const FamilyScreen: React.FC<FamilyScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { members, isLoading, error } = useSelector((state: RootState) => state.family);

  useEffect(() => {
    dispatch(fetchFamilyMembers());
  }, [dispatch]);

  const handleAddMember = () => {
    navigation.navigate('AddFamilyMember');
  };

  const handleEditMember = (member: FamilyMember) => {
    navigation.navigate('EditFamilyMember', { memberId: member.id });
  };

  const handleDeleteMember = (member: FamilyMember) => {
    Alert.alert(
      'メンバーを削除',
      `${member.name}を家族から削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: () => {
            dispatch(deleteFamilyMember(member.id));
            Alert.alert('削除', `${member.name}を削除しました。`);
          }
        }
      ]
    );
  };

  const renderMemberItem = ({ item }: { item: FamilyMember }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <Ionicons 
          name={item.role === 'parent' ? 'person' : 'person-outline'} 
          size={32} 
          color="#6B7C32" 
        />
        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberRole}>
            {item.role === 'parent' ? '保護者' : '子供'}
            {item.isProxy && ' (代理登録可)'}
          </Text>
        </View>
      </View>
      
      <View style={styles.memberActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleEditMember(item)}
        >
          <Ionicons name="create-outline" size={20} color="#6B7C32" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleDeleteMember(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#D9534F" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={60} color="#ccc" />
      <Text style={styles.emptyText}>まだ家族メンバーが登録されていません。</Text>
      <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddMember}>
        <Text style={styles.emptyAddButtonText}>家族メンバーを追加する</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B7C32" />
        <Text style={styles.loadingText}>家族メンバーを読み込み中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={60} color="#D9534F" />
        <Text style={styles.errorText}>エラーが発生しました: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => dispatch(fetchFamilyMembers())}>
          <Text style={styles.retryButtonText}>再試行</Text>
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
        <Text style={styles.headerTitle}>家族メンバー</Text>
        <TouchableOpacity onPress={handleAddMember} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#6B7C32" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={renderMemberItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D9534F',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6B7C32',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
  },
  memberCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberDetails: {
    marginLeft: 12,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyAddButton: {
    backgroundColor: '#6B7C32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FamilyScreen;
