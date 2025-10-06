import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddMemberModalProps {
  visible: boolean;
  onClose: () => void;
  onAddMember: (member: { name: string; isProxy: boolean }) => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ visible, onClose, onAddMember }) => {
  const [memberName, setMemberName] = useState('');
  const [isProxy, setIsProxy] = useState(true);

  const handleSubmit = () => {
    if (!memberName.trim()) {
      Alert.alert('エラー', '名前を入力してください。');
      return;
    }

    onAddMember({
      name: memberName.trim(),
      isProxy,
    });

    // フォームをリセット
    setMemberName('');
    setIsProxy(true);
    onClose();
  };

  const handleCancel = () => {
    setMemberName('');
    setIsProxy(true);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>家族メンバーを追加</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>名前</Text>
              <TextInput
                style={styles.input}
                placeholder="例: 太郎"
                value={memberName}
                onChangeText={setMemberName}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.proxySection}>
              <View style={styles.proxyHeader}>
                <Text style={styles.label}>代理登録可能</Text>
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
                  style={[styles.proxyOption, isProxy && styles.proxyOptionActive]}
                  onPress={() => setIsProxy(true)}
                >
                  <View style={[styles.radioButton, isProxy && styles.radioButtonActive]} />
                  <Text style={[styles.proxyOptionText, isProxy && styles.proxyOptionTextActive]}>
                    はい（他のメンバーの代理登録可能）
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.proxyOption, !isProxy && styles.proxyOptionActive]}
                  onPress={() => setIsProxy(false)}
                >
                  <View style={[styles.radioButton, !isProxy && styles.radioButtonActive]} />
                  <Text style={[styles.proxyOptionText, !isProxy && styles.proxyOptionTextActive]}>
                    いいえ（自分のみ）
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
              <Text style={styles.addButtonText}>追加</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  proxySection: {
    marginBottom: 10,
  },
  proxyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoButton: {
    marginLeft: 8,
    padding: 2,
  },
  proxyOptions: {
    gap: 10,
  },
  proxyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
  },
  proxyOptionActive: {
    borderColor: '#6B7C32',
    backgroundColor: '#E8F5E9',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonActive: {
    borderColor: '#6B7C32',
    backgroundColor: '#6B7C32',
  },
  proxyOptionText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  proxyOptionTextActive: {
    color: '#6B7C32',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6B7C32',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AddMemberModal;

