import React from 'react';
import { View, Text, ViewProps } from 'react-native';

export interface BadgeProps extends ViewProps {
  variant?: 'default' | 'success' | 'destructive' | 'outline';
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = 'default',
  children,
  className = '',
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-primary',
    success: 'bg-positive',
    destructive: 'bg-destructive',
    outline: 'bg-transparent border border-border',
  };

  const textVariantStyles = {
    default: 'text-primary-foreground',
    success: 'text-white',
    destructive: 'text-white',
    outline: 'text-foreground',
  };

  return (
    <View
      className={`px-2.5 py-1 rounded-full ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <Text className={`text-xs font-semibold ${textVariantStyles[variant]}`}>
        {children}
      </Text>
    </View>
  );
}
