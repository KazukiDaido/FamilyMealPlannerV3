import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { addFamilyMember, loginAsMember } from '../../store/slices/familySlice';
import { setCurrentFamilyGroup } from '../../store/slices/familyGroupSlice';
import { startRealtimeSync } from '../../store/slices/familySlice';
import FamilyGroupService from '../../services/familyGroupService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddMemberModal from '../../components/AddMemberModal';

interface InitialSetupScreenProps {
  navigation: any;
  onComplete?: () => void;
}

const InitialSetupScreen: React.FC<InitialSetupScreenProps> = ({ navigation, onComplete }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((state: RootState) => state.family);

  const [familyName, setFamilyName] = useState('');
  const [members, setMembers] = useState([
    { name: '', isProxy: true },
  ]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const handleAddMember = (newMember: { name: string; isProxy: boolean }) => {
    setMembers([...members, newMember]);
  };

  const handleRemoveMember = (index: number) => {
    if (members.length <= 1) {
      Alert.alert('エラー', '少なくとも1人の家族メンバーが必要です。');
      return;
    }
    
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };

  const handleMemberNameChange = (text: string, index: number) => {
    const newMembers = [...members];
    newMembers[index].name = text;
    setMembers(newMembers);
  };

  const handleMemberProxyChange = (isProxy: boolean, index: number) => {
    const newMembers = [...members];
    newMembers[index].isProxy = isProxy;
    setMembers(newMembers);
  };

  const handleComplete = async () => {
    console.log('InitialSetupScreen: 設定完了処理を開始');
    
    if (!familyName.trim()) {
      Alert.alert('エラー', '家族名を入力してください。');
      return;
    }

    const validMembers = members.filter(member => member.name.trim());
    if (validMembers.length === 0) {
      Alert.alert('エラー', '少なくとも1人の家族メンバーを登録してください。');
      return;
    }

    console.log('InitialSetupScreen: バリデーション完了', { familyName, validMembers });

        try {
          // まず家族グループを作成（一時的なIDで）
          const tempFamilyId = `temp_${Date.now()}`;
          const familyGroup = await FamilyGroupService.createFamilyGroup(
            familyName.trim(),
            tempFamilyId, // 一時的なID
            {
              allowGuestJoin: true,
              requireApproval: false,
            }
          );

          console.log('InitialSetupScreen: 家族グループ作成完了:', familyGroup);

          // Redux stateを更新
          dispatch(setCurrentFamilyGroup(familyGroup));

          // 正しいfamilyIdで家族メンバーを追加
          let firstMemberId = '';
          console.log('InitialSetupScreen: 家族メンバーを追加中...');

          for (let i = 0; i < validMembers.length; i++) {
            const member = validMembers[i];
            console.log(`InitialSetupScreen: メンバー${i + 1}を追加:`, member);

            const result = await dispatch(addFamilyMember({
              name: member.name.trim(),
              role: 'parent', // 親/子の判定を削除
              isProxy: member.isProxy,
              familyId: familyGroup.id, // 正しいfamilyIdを設定
            })).unwrap();

            console.log('InitialSetupScreen: メンバー追加結果:', result);

            // 最初のメンバーをログイン状態にする
            if (i === 0) {
              firstMemberId = result.id;
            }
          }

      // リアルタイム同期を開始
      try {
        dispatch(startRealtimeSync(familyGroup.id));
        console.log('InitialSetupScreen: リアルタイム同期開始');
      } catch (syncError) {
        console.warn('InitialSetupScreen: リアルタイム同期開始エラー（続行）:', syncError);
      }

      // 初回起動フラグを設定
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      await AsyncStorage.setItem('familyName', familyName.trim());
      console.log('InitialSetupScreen: ローカルストレージに保存完了');

      // 最初のメンバーでログイン
      if (firstMemberId) {
        console.log('InitialSetupScreen: 最初のメンバーでログイン中...', firstMemberId);
        await dispatch(loginAsMember(firstMemberId)).unwrap();
        console.log('InitialSetupScreen: ログイン完了');
      }

      console.log('InitialSetupScreen: セットアップ完了、アラート表示');

      Alert.alert(
        'セットアップ完了！',
        `${familyName}の設定が完了しました。\n\n家族コード: ${familyGroup.familyCode}`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('InitialSetupScreen: アラートOKボタン押下、onComplete呼び出し');
              if (onComplete) {
                onComplete();
              } else {
                console.warn('InitialSetupScreen: onCompleteが未定義');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('InitialSetupScreen: セットアップエラー:', error);
      Alert.alert('エラー', `セットアップに失敗しました: ${error.message || '不明なエラー'}`);
    }
  };

  const renderMemberCard = (member: any, index: number) => (
    <View key={index} style={styles.memberCard}>
      <View style={styles.memberHeader}>
        <Text style={styles.memberLabel}>メンバー {index + 1}</Text>
        {members.length > 1 && (
          <TouchableOpacity onPress={() => handleRemoveMember(index)} style={styles.removeButton}>
            <Ionicons name="close-circle" size={24} color="#D9534F" />
          </TouchableOpacity>
        )}
      </View>
      
      <TextInput
        style={styles.input}
        placeholder={index === 0 ? "あなたの名前を入力" : "名前を入力"}
        value={member.name}
        onChangeText={(text) => handleMemberNameChange(text, index)}
        autoCapitalize="words"
        placeholderTextColor="#999"
      />
      
      <View style={styles.proxyContainer}>
        <View style={styles.proxyHeader}>
          <Text style={styles.proxyLabel}>代理登録可能</Text>
          <TouchableOpacity 
            style={styles.infoButton}
            onPress={() => {
              Alert.alert(
                '代理登録とは？',
                '他の家族メンバーの食事参加を代わりに登録できる機能です。\n\n例：お母さんが子供たちの食事参加をまとめて登録する',
                [{ text: 'OK' }]
              );
            }}
          >
            <Ionicons name="help-circle-outline" size={20} color="#6B7C32" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.proxyOptions}>
          <TouchableOpacity
            style={[styles.proxyButton, member.isProxy && styles.proxyButtonActive]}
            onPress={() => handleMemberProxyChange(true, index)}
          >
            <Text style={[styles.proxyButtonText, member.isProxy && styles.proxyButtonTextActive]}>
              はい
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.proxyButton, !member.isProxy && styles.proxyButtonActive]}
            onPress={() => handleMemberProxyChange(false, index)}
          >
            <Text style={[styles.proxyButtonText, !member.isProxy && styles.proxyButtonTextActive]}>
              いいえ
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>家族の初期設定</Text>
        <Text style={styles.headerSubtitle}>
          家族名を入力し、家族メンバーを登録してください
        </Text>
      </View>

      <ScrollView style={styles.formContainer} contentContainerStyle={styles.scrollContent}>
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
            <TouchableOpacity 
              style={styles.addMemberButton} 
              onPress={() => setShowAddMemberModal(true)}
            >
              <Ionicons name="add-circle-outline" size={24} color="#6B7C32" />
              <Text style={styles.addMemberButtonText}>メンバーを追加</Text>
            </TouchableOpacity>
          </View>
          
          {members.map(renderMemberCard)}
        </View>
        
        {/* スクロール用の余白 */}
        <View style={styles.scrollSpacer} />
      </ScrollView>

      {/* 固定フッター */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
          <Text style={styles.completeButtonText}>設定を完了する</Text>
        </TouchableOpacity>
      </View>

      <AddMemberModal
        visible={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onAddMember={handleAddMember}
      />
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  scrollSpacer: {
    height: 100, // フッターの高さ分の余白
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#6B7C32',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    backgroundColor: '#F9F9F9',
  },
  memberCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#F9F9F9',
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  memberLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  removeButton: {
    padding: 5,
  },
  proxyContainer: {
    marginTop: 10,
  },
  proxyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  proxyLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  infoButton: {
    marginLeft: 8,
    padding: 2,
  },
  proxyOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  proxyButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  proxyButtonActive: {
    backgroundColor: '#6B7C32',
  },
  proxyButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  proxyButtonTextActive: {
    color: 'white',
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6B7C32',
  },
  addMemberButtonText: {
    fontSize: 14,
    color: '#6B7C32',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  completeButton: {
    backgroundColor: '#6B7C32',
    paddingVertical: 15,
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