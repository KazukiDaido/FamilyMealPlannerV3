import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PINInputProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  memberName: string;
  title?: string;
}

const PINInput: React.FC<PINInputProps> = ({
  visible,
  onClose,
  onConfirm,
  memberName,
  title = 'PIN認証'
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setPin('');
      setError('');
      // モーダルが開いたときにキーボードを表示
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  const handlePinChange = (text: string) => {
    // 数字のみ4桁まで
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 4);
    setPin(numericText);
    setError('');
    
    // 4桁入力されたら自動確認
    if (numericText.length === 4) {
      onConfirm(numericText);
    }
  };

  const handleConfirm = () => {
    if (pin.length === 4) {
      onConfirm(pin);
    } else {
      setError('4桁のPINを入力してください');
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.memberName}>{memberName}</Text>
            <Text style={styles.subtitle}>4桁のPINを入力してください</Text>
            
            <View style={styles.pinContainer}>
              <TextInput
                ref={inputRef}
                style={styles.pinInput}
                value={pin}
                onChangeText={handlePinChange}
                placeholder="0000"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={true}
                textAlign="center"
                fontSize={24}
                letterSpacing={8}
              />
            </View>
            
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}
            
            <View style={styles.pinDots}>
              {[0, 1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.pinDot,
                    index < pin.length && styles.pinDotFilled
                  ]}
                />
              ))}
            </View>
          </View>
          
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, pin.length === 4 ? styles.buttonActive : styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={pin.length !== 4}
            >
              <Text style={[styles.buttonText, pin.length === 4 ? styles.buttonTextActive : styles.buttonTextDisabled]}>
                確認
              </Text>
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
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  memberName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B7C32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  pinContainer: {
    marginBottom: 16,
  },
  pinInput: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    width: 120,
    height: 60,
    backgroundColor: '#f9f9f9',
  },
  pinDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },
  pinDotFilled: {
    backgroundColor: '#6B7C32',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#6B7C32',
  },
  buttonDisabled: {
    backgroundColor: '#ddd',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextActive: {
    color: 'white',
  },
  buttonTextDisabled: {
    color: '#999',
  },
});

export default PINInput;
