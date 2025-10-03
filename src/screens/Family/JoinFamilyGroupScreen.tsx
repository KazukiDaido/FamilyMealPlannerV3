import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { setCurrentFamilyGroup } from '../../store/slices/familyGroupSlice';
import FamilyGroupService from '../../services/familyGroupService';

interface JoinFamilyGroupScreenProps {
  navigation: any;
}

const JoinFamilyGroupScreen: React.FC<JoinFamilyGroupScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [familyCode, setFamilyCode] = useState('');
  const [memberName, setMemberName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchFamilyGroup = async () => {
    if (!familyCode.trim()) {
      Alert.alert('エラー', '家族コードを入力してください。');
      return;
    }

    if (familyCode.length !== 8) {
      Alert.alert('エラー', '家族コードは8桁の英数字で入力してください。');
      return;
    }

    if (!/^[A-Z0-9]{8}$/.test(familyCode)) {
      Alert.alert('エラー', '家族コードは大文字の英数字8桁で入力してください。');
      return;
    }

    setIsSearching(true);
    
    try {
      const familyGroup = await FamilyGroupService.getFamilyGroupByCode(familyCode.trim());
      
      if (!familyGroup) {
        Alert.alert('エラー', '指定された家族コードの家族グループが見つかりません。');
        return;
      }

      Alert.alert(
        '家族グループが見つかりました！',
        `家族名: ${familyGroup.name}\nメンバー数: ${familyGroup.memberCount}人`,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '参加する',
            onPress: () => handleJoinFamilyGroup(familyGroup),
          },
        ]
      );
    } catch (error: any) {
      console.error('家族グループ検索エラー:', error);
      Alert.alert('エラー', error.message || '家族グループの検索に失敗しました。');
    } finally {
      setIsSearching(false);
    }
  };

  const handleJoinFamilyGroup = async (familyGroup: any) => {
    if (!memberName.trim()) {
      Alert.alert('エラー', 'あなたの名前を入力してください。');
      return;
    }

    if (!currentUser) {
      Alert.alert('エラー', 'ユーザー情報が見つかりません。');
      return;
    }

    setIsJoining(true);
    
    try {
      if (familyGroup.settings.requireApproval) {
        // 承認が必要な場合
        await FamilyGroupService.createJoinRequest(
          familyGroup.id,
          memberName.trim(),
          currentUser.id
        );

        Alert.alert(
          '参加リクエストを送信しました！',
          '家族グループの管理者が参加を承認するまでお待ちください。\n承認されると、アプリで家族の食事管理に参加できます。',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        // 即座に参加可能な場合
        dispatch(setCurrentFamilyGroup(familyGroup));

        Alert.alert(
          '家族グループに参加しました！',
          `ようこそ、${familyGroup.name}へ！\nこれで家族の食事管理に参加できます。`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('家族グループ参加エラー:', error);
      Alert.alert('エラー', error.message || '家族グループへの参加に失敗しました。');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'キャンセル',
      '家族グループへの参加をキャンセルしますか？',
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
        <Text style={styles.headerTitle}>家族グループに参加</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>家族コードを入力</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>8桁の家族コード</Text>
              <TextInput
                style={styles.codeInput}
                value={familyCode}
                onChangeText={(text) => setFamilyCode(text.replace(/[^A-Z0-9]/g, '').toUpperCase())}
                placeholder="ABC12345"
                placeholderTextColor="#999"
                keyboardType="default"
                maxLength={8}
                textAlign="center"
                autoCapitalize="characters"
              />
              <Text style={styles.inputHint}>
                家族グループ作成者から教えてもらった8桁の英数字コードを入力してください
              </Text>
            </View>

            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>または</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.qrScannerButton}
              onPress={() => navigation.navigate('QRCodeScanner')}
            >
              <Ionicons name="qr-code-outline" size={24} color="white" />
              <Text style={styles.qrScannerButtonText}>QRコードをスキャン</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
              onPress={handleSearchFamilyGroup}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="search-outline" size={20} color="white" />
                  <Text style={styles.searchButtonText}>家族グループを検索</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>あなたの情報</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>あなたの名前</Text>
              <TextInput
                style={styles.textInput}
                value={memberName}
                onChangeText={setMemberName}
                placeholder="例: 太郎、花子"
                placeholderTextColor="#999"
                maxLength={20}
              />
              <Text style={styles.inputHint}>
                家族メンバーに表示される名前を入力してください
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Ionicons name="information-circle-outline" size={20} color="#6B7C32" />
            <Text style={styles.infoText}>
              家族コードを入力して家族グループを検索し、あなたの名前を入力して参加しましょう。
              一部の家族グループでは、参加前に承認が必要な場合があります。
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
          onPress={() => {
            if (familyCode && memberName) {
              handleSearchFamilyGroup();
            } else {
              Alert.alert('エラー', '家族コードとあなたの名前を入力してください。');
            }
          }}
          disabled={isJoining || isSearching}
        >
          {isJoining ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="people-outline" size={20} color="white" />
              <Text style={styles.joinButtonText}>家族グループに参加</Text>
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
  codeInput: {
    borderWidth: 2,
    borderColor: '#6B7C32',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: '#F8F9FA',
    letterSpacing: 4,
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
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  searchButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  joinButton: {
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
  joinButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    width: 60,
    textAlign: 'center',
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  qrScannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrScannerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default JoinFamilyGroupScreen;
