import React from 'react';
import { Pressable, Text, ActivityIndicator, PressableProps } from 'react-native';

export interface ButtonProps extends PressableProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'default',
  size = 'default',
  loading = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'flex-row items-center justify-center rounded-lg';

  const variantStyles = {
    default: 'bg-primary',
    outline: 'bg-transparent border border-border',
    ghost: 'bg-transparent',
    destructive: 'bg-destructive',
  };

  const sizeStyles = {
    sm: 'px-3 py-2',
    default: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const textVariantStyles = {
    default: 'text-primary-foreground font-semibold',
    outline: 'text-foreground font-semibold',
    ghost: 'text-foreground font-semibold',
    destructive: 'text-white font-semibold',
  };

  const textSizeStyles = {
    sm: 'text-sm',
    default: 'text-base',
    lg: 'text-lg',
  };

  const disabledStyles = disabled || loading ? 'opacity-50' : '';

  const spinnerColor = variant === 'outline' || variant === 'ghost' ? '#0f172a' : '#ffffff';

  const renderChildren = () => {
    if (typeof children === 'string') {
      return (
        <Text className={`${textVariantStyles[variant]} ${textSizeStyles[size]}`}>
          {children}
        </Text>
      );
    }
    return children;
  };

  return (
    <Pressable
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        renderChildren()
      )}
    </Pressable>
  );
}
