import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface FamilyIdInputScreenProps {
  navigation: any;
  onFamilyIdSubmit: (familyId: string) => void;
}

const FamilyIdInputScreen: React.FC<FamilyIdInputScreenProps> = ({ navigation, onFamilyIdSubmit }) => {
  const [familyId, setFamilyId] = useState('');

  const handleSubmit = () => {
    if (!familyId.trim()) {
      Alert.alert('エラー', '家族IDを入力してください。');
      return;
    }

    if (familyId.length !== 8) {
      Alert.alert('エラー', '家族IDは8桁の英数字で入力してください。');
      return;
    }

    if (!/^[A-Z0-9]{8}$/.test(familyId)) {
      Alert.alert('エラー', '家族IDは大文字の英数字8桁で入力してください。');
      return;
    }

    // TODO: 実際の家族ID検証ロジックを実装
    // ここでは仮で、家族IDが存在するかどうかをチェック
    Alert.alert(
      '家族グループに参加',
      `家族ID "${familyId}" で家族グループに参加しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '参加', 
          onPress: () => {
            // 既存の家族に参加する場合は、ログイン画面に遷移
            // ここでは仮で初期設定画面に遷移
            navigation.navigate('InitialSetup');
          }
        }
      ]
    );
  };

  const handleQRScan = () => {
    Alert.alert(
      'QRコードスキャン',
      'QRコードスキャン機能を使用しますか？\n\n注意: シミュレーターではカメラが利用できない場合があります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'スキャンする', 
          onPress: () => {
            // QRコードスキャン画面に遷移
            navigation.navigate('QRCodeScanner');
          }
        }
      ]
    );
  };

  const handleCreateNewFamily = () => {
    Alert.alert(
      '新しい家族を作成',
      '新しい家族グループを作成しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '作成', onPress: () => navigation.navigate('InitialSetup') }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>家族グループに参加</Text>
        <Text style={styles.headerSubtitle}>
          既存の家族グループに参加するか、新しい家族を作成してください
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>家族ID</Text>
          <Text style={styles.inputDescription}>
            家族の誰かから教えてもらった8桁の家族IDを入力してください
          </Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.familyIdInput}
              placeholder="例: ABC12345"
              value={familyId}
              onChangeText={(text) => setFamilyId(text.replace(/[^A-Z0-9]/g, '').toUpperCase())}
              autoCapitalize="characters"
              maxLength={8}
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>家族に参加</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>または</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.qrScanButton} onPress={handleQRScan}>
          <Ionicons name="qr-code-outline" size={24} color="#007AFF" />
          <Text style={styles.qrScanButtonText}>QRコードをスキャン</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.createFamilyButton} onPress={handleCreateNewFamily}>
          <Ionicons name="add-circle-outline" size={24} color="#6B7C32" />
          <Text style={styles.createFamilyButtonText}>新しい家族を作成</Text>
        </TouchableOpacity>

        <View style={styles.helpSection}>
          <View style={styles.helpItem}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.helpText}>
              家族IDは家族の誰かが「家族」タブで確認できます
            </Text>
          </View>
          <View style={styles.helpItem}>
            <Ionicons name="qr-code-outline" size={20} color="#666" />
            <Text style={styles.helpText}>
              QRコードでも家族IDを共有できます
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7C32',
    marginBottom: 8,
  },
  inputDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  familyIdInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 2,
    backgroundColor: '#F9F9F9',
  },
  submitButton: {
    backgroundColor: '#6B7C32',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
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
    marginHorizontal: 15,
    fontSize: 14,
    color: '#666',
  },
  createFamilyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6B7C32',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createFamilyButtonText: {
    fontSize: 16,
    color: '#6B7C32',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  qrScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrScanButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  helpSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
});

export default FamilyIdInputScreen;
