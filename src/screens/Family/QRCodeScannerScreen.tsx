import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, Camera, CameraType } from 'expo-camera';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { setCurrentFamilyGroup } from '../../store/slices/familyGroupSlice';
import FamilyGroupService from '../../services/familyGroupService';

interface QRCodeScannerScreenProps {
  navigation: any;
}

const QRCodeScannerScreen: React.FC<QRCodeScannerScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      try {
        console.log('カメラ権限を要求中...');
        const { status } = await Camera.requestCameraPermissionsAsync();
        console.log('カメラ権限の結果:', status);
        setHasPermission(status === 'granted');
      } catch (error) {
        console.error('カメラ権限エラー:', error);
        setHasPermission(false);
      }
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || isProcessing) return;
    
    setScanned(true);
    setIsProcessing(true);

    try {
      console.log('QRコードスキャン:', { type, data });
      
      // QRコードのデータ形式をチェック
      if (!data.startsWith('familycode:')) {
        Alert.alert(
          'エラー',
          'このQRコードは家族グループ用ではありません。',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
        return;
      }

      const familyCode = data.replace('familycode:', '');
      
      if (familyCode.length !== 8 || !/^[A-Z0-9]{8}$/.test(familyCode)) {
        Alert.alert(
          'エラー',
          '無効な家族コードです。',
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
        return;
      }

      // デモ用の家族グループデータを作成
      const demoFamilyGroup = {
        id: `demo-family-${familyCode}`,
        name: 'デモ家族',
        familyCode: familyCode,
        memberCount: 3,
        settings: {
          allowGuestJoin: true,
          requireApproval: false,
        },
        createdAt: new Date().toISOString(),
      };

      // 参加確認ダイアログ
      Alert.alert(
        '家族グループが見つかりました！',
        `家族名: ${demoFamilyGroup.name}\nメンバー数: ${demoFamilyGroup.memberCount}人\n\nこの家族グループに参加しますか？`,
        [
          { text: 'キャンセル', onPress: () => setScanned(false) },
          {
            text: '参加する',
            onPress: () => handleJoinFamilyGroup(demoFamilyGroup),
          },
        ]
      );
    } catch (error: any) {
      console.error('QRコード処理エラー:', error);
      Alert.alert(
        'エラー',
        error.message || 'QRコードの処理に失敗しました。',
        [{ text: 'OK', onPress: () => setScanned(false) }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoinFamilyGroup = async (familyGroup: any) => {
    if (!currentUser) {
      Alert.alert('エラー', 'ユーザー情報が見つかりません。');
      return;
    }

    try {
      if (familyGroup.settings.requireApproval) {
        // 承認が必要な場合
        await FamilyGroupService.createJoinRequest(
          familyGroup.id,
          currentUser.name || '新しいメンバー',
          currentUser.id
        );

        Alert.alert(
          '参加リクエストを送信しました！',
          '家族グループの管理者が参加を承認するまでお待ちください。',
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
          `ようこそ、${familyGroup.name}へ！`,
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
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'キャンセル',
      'QRコードスキャンをキャンセルしますか？',
      [
        { text: '続ける', style: 'cancel' },
        {
          text: 'キャンセル',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const handleDemoScan = () => {
    // デモ用のスキャン機能
    Alert.alert(
      'デモスキャン',
      'デモ用のQRコードをスキャンしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'スキャンする',
          onPress: () => {
            // デモ用の家族コードでスキャンをシミュレート
            handleBarCodeScanned({
              type: 'qr',
              data: 'familycode:AW9HK68F'
            });
          },
        },
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B7C32" />
          <Text style={styles.loadingText}>カメラの権限を確認中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QRコードスキャン</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="camera-outline" size={80} color="#999" />
          <Text style={styles.errorTitle}>カメラの権限が必要です</Text>
          <Text style={styles.errorDescription}>
            QRコードをスキャンするためにカメラの権限が必要です。
            設定アプリから権限を許可してください。
          </Text>
          <TouchableOpacity style={styles.settingsButton} onPress={handleCancel}>
            <Text style={styles.settingsButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QRコードスキャン</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.scannerContainer}>
        {hasPermission ? (
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            style={styles.scanner}
            facing="back"
          />
        ) : (
          <View style={styles.cameraErrorContainer}>
            <Ionicons name="camera-outline" size={80} color="#999" />
            <Text style={styles.cameraErrorText}>カメラにアクセスできません</Text>
          </View>
        )}
        
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.processingText}>処理中...</Text>
          </View>
        )}

        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerInstruction}>
            家族グループのQRコードをカメラにかざしてください
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.demoButton}
          onPress={handleDemoScan}
        >
          <Ionicons name="qr-code-outline" size={20} color="#6B7C32" />
          <Text style={styles.demoButtonText}>デモスキャン</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => navigation.navigate('JoinFamilyGroup')}
        >
          <Ionicons name="keypad-outline" size={20} color="#6B7C32" />
          <Text style={styles.manualButtonText}>手動でコード入力</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6B7C32',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F7F7F7',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  errorDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  settingsButton: {
    backgroundColor: '#6B7C32',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  settingsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#6B7C32',
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  scannerInstruction: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B7C32',
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6B7C32',
  },
  demoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6B7C32',
  },
  manualButtonText: {
    color: '#6B7C32',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cameraErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  cameraErrorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default QRCodeScannerScreen;
