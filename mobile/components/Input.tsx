import React from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({
  label,
  error,
  className = '',
  ...props
}: InputProps) {
  return (
    <View className="w-full">
      {label && (
        <Text className="text-sm font-medium text-foreground mb-2">
          {label}
        </Text>
      )}
      <TextInput
        className={`
          bg-background border border-border rounded-lg px-4 py-3
          text-base text-foreground
          ${error ? 'border-destructive' : 'border-border'}
          ${className}
        `}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error && (
        <Text className="text-sm text-destructive mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
