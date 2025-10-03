import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import SimpleQRCode from './SimpleQRCode';
import * as Clipboard from 'expo-clipboard';

interface QRCodeShareModalProps {
  visible: boolean;
  onClose: () => void;
  familyCode: string;
  familyName: string;
}

const QRCodeShareModal: React.FC<QRCodeShareModalProps> = ({
  visible,
  onClose,
  familyCode,
  familyName,
}) => {
  console.log('QRCodeShareModal レンダリング:', { visible, familyCode, familyName });
  const shareContent = `家族グループ「${familyName}」に参加しませんか？\n\n家族コード: ${familyCode}\n\nこのコードを使って家族の食事管理アプリに参加できます！`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: shareContent,
        title: '家族グループへの招待',
      });
    } catch (error) {
      console.error('シェアエラー:', error);
    }
  };

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(familyCode);
      Alert.alert(
        'コピー完了',
        '家族コードをクリップボードにコピーしました。',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('コピーエラー:', error);
      Alert.alert('エラー', 'コピーに失敗しました。');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>家族コードを共有</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close-circle-outline" size={28} color="#888" />
              </TouchableOpacity>
            </View>

                <View style={styles.content}>
                  <View style={styles.familyInfo}>
                    <Text style={styles.familyName}>{familyName}</Text>
                    <Text style={styles.familyCodeLabel}>家族コード</Text>
                    <Text style={styles.familyCode}>{familyCode}</Text>
                  </View>

                  <View style={styles.qrSection}>
                    <View style={styles.qrCodeContainer}>
                      <SimpleQRCode
                        value={`familycode:${familyCode}`}
                        size={200}
                        color="#000000"
                        backgroundColor="#FFFFFF"
                      />
                    </View>
                    
                    <Text style={styles.qrCodeDescription}>
                      QRコードをスキャンして家族グループに参加できます
                    </Text>
                  </View>

                  <View style={styles.actionButtonsContainer}>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                        <Ionicons name="share-outline" size={18} color="white" />
                        <Text style={styles.shareButtonText}>招待メッセージを送信</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
                        <Ionicons name="copy-outline" size={18} color="#6B7C32" />
                        <Text style={styles.copyButtonText}>コードをコピー</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '92%',
    height: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  familyInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 24,
    flex: 1,
    justifyContent: 'center',
  },
  familyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6B7C32',
    marginBottom: 10,
  },
  familyCodeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  familyCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 4,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6B7C32',
  },
  qrCodeContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  qrCodeDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  actionButtonsContainer: {
    paddingBottom: 32,
    paddingTop: 12,
    width: '100%',
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B7C32',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6B7C32',
    minHeight: 48,
  },
  copyButtonText: {
    color: '#6B7C32',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  debugText: {
    fontSize: 16,
    color: '#FF0000',
    textAlign: 'center',
    marginVertical: 5,
    fontWeight: 'bold',
    backgroundColor: '#FFFACD',
    padding: 5,
    borderRadius: 5,
  },
});

export default QRCodeShareModal;
