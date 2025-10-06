import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { setCurrentFamilyGroup } from '../../store/slices/familyGroupSlice';
import { startRealtimeSync } from '../../store/slices/familySlice';
import FamilyGroupService from '../../services/familyGroupService';

interface CreateFamilyGroupScreenProps {
  navigation: any;
}

const CreateFamilyGroupScreen: React.FC<CreateFamilyGroupScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [familyName, setFamilyName] = useState('');
  const [allowGuestJoin, setAllowGuestJoin] = useState(true);
  const [requireApproval, setRequireApproval] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateFamilyGroup = async () => {
    if (!familyName.trim()) {
      Alert.alert('エラー', '家族名を入力してください。');
      return;
    }

    setIsCreating(true);
    
    try {
      // ローカル動作: ダミーユーザーIDを使用
      const userId = currentUser?.id || 'local-user-1';
      
      const familyGroup = await FamilyGroupService.createFamilyGroup(
        familyName.trim(),
        userId,
        {
          allowGuestJoin,
          requireApproval,
        }
      );

      // Redux stateを更新
      console.log('CreateFamilyGroupScreen: 家族グループを作成しました:', familyGroup);
      dispatch(setCurrentFamilyGroup(familyGroup));

      // リアルタイム同期を開始
      dispatch(startRealtimeSync(familyGroup.id));

      Alert.alert(
        '家族グループを作成しました！',
        `家族コード: ${familyGroup.familyCode}\n\nリアルタイム同期が開始されました。\n家族メンバーが食事参加を回答すると、即座に反映されます。`,
        [
          {
            text: 'OK',
            onPress: () => {
              // ホーム画面に遷移
              navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('家族グループ作成エラー:', error);
      Alert.alert('エラー', error.message || '家族グループの作成に失敗しました。');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'キャンセル',
      '家族グループの作成をキャンセルしますか？',
      [
        { text: '続ける', style: 'cancel' },
        {
          text: 'キャンセル',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>家族グループを作成</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>基本情報</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>家族名</Text>
              <TextInput
                style={styles.textInput}
                value={familyName}
                onChangeText={setFamilyName}
                placeholder="例: 田中家、佐藤ファミリー"
                placeholderTextColor="#999"
                maxLength={20}
              />
              <Text style={styles.inputHint}>
                他の家族メンバーが識別しやすい名前を入力してください
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>参加設定</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>ゲスト参加を許可</Text>
                <Text style={styles.settingDescription}>
                  家族コードを知っている人なら誰でも参加できます
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  allowGuestJoin && styles.toggleButtonActive,
                ]}
                onPress={() => setAllowGuestJoin(!allowGuestJoin)}
              >
                <View style={[
                  styles.toggleCircle,
                  allowGuestJoin && styles.toggleCircleActive,
                ]} />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>参加承認が必要</Text>
                <Text style={styles.settingDescription}>
                  参加リクエストを承認してからメンバーに追加します
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  requireApproval && styles.toggleButtonActive,
                ]}
                onPress={() => setRequireApproval(!requireApproval)}
              >
                <View style={[
                  styles.toggleCircle,
                  requireApproval && styles.toggleCircleActive,
                ]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Ionicons name="information-circle-outline" size={20} color="#6B7C32" />
            <Text style={styles.infoText}>
              家族グループを作成すると、6桁の家族コードが生成されます。
              このコードを家族メンバーに共有して、アプリに参加してもらいましょう。
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, isCreating && styles.createButtonDisabled]}
          onPress={handleCreateFamilyGroup}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text style={styles.createButtonText}>家族グループを作成</Text>
            </>
          )}
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
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingContent: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#6B7C32',
    alignItems: 'flex-end',
  },
  toggleCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleCircleActive: {
    backgroundColor: 'white',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B7C32',
    paddingVertical: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default CreateFamilyGroupScreen;
