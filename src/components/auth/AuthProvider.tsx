import React from 'react';
import { View } from 'react-native';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // 簡易版認証プロバイダー
  return <View style={{ flex: 1 }}>{children}</View>;
}

