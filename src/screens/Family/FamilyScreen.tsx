import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchFamilyMembers, addFamilyMember, deleteFamilyMember } from '../../store/slices/familySlice';
import { FamilyMember } from '../../types';
import QRCodeShareModal from '../../components/QRCodeShareModal';

interface FamilyScreenProps {
  navigation: any;
}

const FamilyScreen: React.FC<FamilyScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { members, isLoading, error } = useSelector((state: RootState) => state.family);
  const { currentFamilyGroup } = useSelector((state: RootState) => state.familyGroup);
  const [showQRModal, setShowQRModal] = useState(false);

  console.log('FamilyScreen: 現在の状態:', { 
    members: members.length, 
    isLoading, 
    error,
    currentFamilyGroup: currentFamilyGroup ? {
      id: currentFamilyGroup.id,
      name: currentFamilyGroup.name,
      familyCode: currentFamilyGroup.familyCode
    } : null
  });

  useEffect(() => {
    console.log('FamilyScreen: 家族メンバーを取得中...');
    dispatch(fetchFamilyMembers()).then((result) => {
      console.log('FamilyScreen: 家族メンバー取得結果:', result);
    });
  }, [dispatch]);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberIsProxy, setNewMemberIsProxy] = useState(false);

  // 現在のメンバーの代理登録権限をチェック
  const canAddMember = () => {
    const state = require('../../store').store.getState();
    const currentMemberId = state.family.currentMemberId;
    const currentMember = members.find(member => member.id === currentMemberId);
    return currentMember?.isProxy === true;
  };

  const handleAddMember = () => {
    if (!canAddMember()) {
      Alert.alert(
        '権限がありません',
        '家族メンバーを追加するには代理登録権限が必要です。'
      );
      return;
    }
    
    setShowAddMemberModal(true);
  };

  const handleSubmitAddMember = async () => {
    if (!newMemberName.trim()) {
      Alert.alert('エラー', '名前を入力してください');
      return;
    }

    const newMember: FamilyMember = {
      id: `member_${Date.now()}`,
      name: newMemberName.trim(),
      role: 'parent', // デフォルトでparentに設定
      isProxy: newMemberIsProxy,
    };

    try {
      await dispatch(addFamilyMember(newMember));
      setNewMemberName('');
      setNewMemberIsProxy(false);
      setShowAddMemberModal(false);
      Alert.alert('成功', '家族メンバーを追加しました');
    } catch (error) {
      console.error('メンバー追加エラー:', error);
      Alert.alert('エラー', 'メンバーの追加に失敗しました');
    }
  };

  const handleEditMember = (member: FamilyMember) => {
    Alert.alert(
      'メンバー権限を変更',
      `${member.name}の代理登録権限を${member.isProxy ? '無効' : '有効'}にしますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '変更',
          onPress: async () => {
            try {
              const updatedMember = { ...member, isProxy: !member.isProxy };
              await dispatch(addFamilyMember(updatedMember)); // 更新として使用
              Alert.alert('成功', `代理登録権限を${updatedMember.isProxy ? '有効' : '無効'}にしました`);
            } catch (error) {
              console.error('権限変更エラー:', error);
              Alert.alert('エラー', '権限の変更に失敗しました');
            }
          }
        }
      ]
    );
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
          </Text>
          <View style={styles.permissionBadge}>
            <Ionicons 
              name={item.isProxy ? 'checkmark-circle' : 'close-circle'} 
              size={16} 
              color={item.isProxy ? '#28a745' : '#dc3545'} 
            />
            <Text style={[
              styles.permissionText,
              { color: item.isProxy ? '#28a745' : '#dc3545' }
            ]}>
              {item.isProxy ? '代理登録可' : '自分のみ'}
            </Text>
          </View>
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

  const renderFamilyGroupActions = () => (
    <View style={styles.familyGroupSection}>
      <Text style={styles.sectionTitle}>家族グループ</Text>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('CreateFamilyGroup')}
        >
          <Ionicons name="add-circle-outline" size={32} color="#6B7C32" />
          <Text style={styles.actionTitle}>新しい家族グループを作成</Text>
          <Text style={styles.actionDescription}>家族のためのグループを作成して、家族コードを共有しましょう</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('JoinFamilyGroup')}
        >
          <Ionicons name="people-outline" size={32} color="#007AFF" />
          <Text style={styles.actionTitle}>既存の家族グループに参加</Text>
          <Text style={styles.actionDescription}>家族コードを使って既存のグループに参加しましょう</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderJoinFamilyGroupButton = () => (
    <View style={styles.joinFamilyGroupSection}>
      <TouchableOpacity 
        style={styles.joinFamilyGroupButton}
        onPress={() => navigation.navigate('JoinFamilyGroup')}
      >
        <Ionicons name="people-outline" size={24} color="#007AFF" />
        <Text style={styles.joinFamilyGroupButtonText}>他の家族グループに参加</Text>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {currentFamilyGroup ? currentFamilyGroup.name : '家族メンバー'}
          </Text>
          {currentFamilyGroup && (
            <Text style={styles.familyCode}>
              家族コード: {currentFamilyGroup.familyCode}
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {currentFamilyGroup && (
            <TouchableOpacity 
              onPress={() => {
                console.log('QRコードボタンがタップされました');
                console.log('currentFamilyGroup:', currentFamilyGroup);
                setShowQRModal(true);
              }} 
              style={styles.qrButton}
            >
              <Ionicons name="qr-code-outline" size={24} color="#6B7C32" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleAddMember} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#6B7C32" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.listContainer}>
        {!currentFamilyGroup && renderFamilyGroupActions()}
        {currentFamilyGroup && renderJoinFamilyGroupButton()}
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMemberItem}
          ListEmptyComponent={renderEmptyState}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </ScrollView>

      {currentFamilyGroup && (
        <QRCodeShareModal
          visible={showQRModal}
          onClose={() => setShowQRModal(false)}
          familyCode={currentFamilyGroup.familyCode}
          familyName={currentFamilyGroup.name}
        />
      )}

      {/* メンバー追加モーダル */}
      <Modal
        visible={showAddMemberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>家族メンバーを追加</Text>
            
            <TextInput
              style={styles.input}
              placeholder="名前"
              value={newMemberName}
              onChangeText={setNewMemberName}
              maxLength={8}
            />
            
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setNewMemberIsProxy(!newMemberIsProxy)}
              >
                <Ionicons
                  name={newMemberIsProxy ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={newMemberIsProxy ? '#6B7C32' : '#666'}
                />
                <Text style={styles.checkboxLabel}>
                  代理登録権限（他のメンバーの食事参加を登録できる）
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddMemberModal(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleSubmitAddMember}
              >
                <Text style={styles.addButtonText}>追加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  familyCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qrButton: {
    padding: 4,
  },
  addButton: {
    padding: 4,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  familyGroupSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionButtons: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
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
  permissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  permissionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
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
  joinFamilyGroupSection: {
    marginBottom: 16,
  },
  joinFamilyGroupButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  joinFamilyGroupButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // モーダル用スタイル
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  checkboxContainer: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  addButton: {
    backgroundColor: '#6B7C32',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FamilyScreen;
