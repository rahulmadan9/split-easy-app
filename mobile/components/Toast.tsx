import React from 'react';
import { View, Text } from 'react-native';
import Toast, { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';

export const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#22c55e',
        backgroundColor: '#ffffff',
        borderLeftWidth: 4,
        height: 70,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
      }}
      text2Style={{
        fontSize: 14,
        color: '#64748b',
      }}
      renderLeadingIcon={() => (
        <View style={{ justifyContent: 'center', paddingLeft: 15 }}>
          <CheckCircle size={24} color="#22c55e" />
        </View>
      )}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#ef4444',
        backgroundColor: '#ffffff',
        borderLeftWidth: 4,
        height: 70,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
      }}
      text2Style={{
        fontSize: 14,
        color: '#64748b',
      }}
      renderLeadingIcon={() => (
        <View style={{ justifyContent: 'center', paddingLeft: 15 }}>
          <XCircle size={24} color="#ef4444" />
        </View>
      )}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#6366f1',
        backgroundColor: '#ffffff',
        borderLeftWidth: 4,
        height: 70,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
      }}
      text2Style={{
        fontSize: 14,
        color: '#64748b',
      }}
      renderLeadingIcon={() => (
        <View style={{ justifyContent: 'center', paddingLeft: 15 }}>
          <AlertCircle size={24} color="#6366f1" />
        </View>
      )}
    />
  ),
};

export { Toast };
