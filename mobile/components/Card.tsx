import React from 'react';
import { View, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <View
      className={`bg-card rounded-2xl border border-border p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
