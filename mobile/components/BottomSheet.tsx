import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import BottomSheetComponent, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
import { colors } from '@/lib/colors';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  snapPoints?: string[];
  children: React.ReactNode;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  snapPoints = ['50%', '75%'],
  children,
}: BottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheetComponent>(null);

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.5}
      pressBehavior="close"
    />
  );

  return (
    <BottomSheetComponent
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.card }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        {title && (
          <View className="flex-row items-center justify-between px-6 pb-4 border-b border-border">
            <Text className="text-lg font-semibold text-foreground">
              {title}
            </Text>
            <Pressable onPress={onClose} className="p-2">
              <X size={24} color={colors.mutedForeground} />
            </Pressable>
          </View>
        )}
        <View className="flex-1 px-6 pt-4">
          {children}
        </View>
      </BottomSheetView>
    </BottomSheetComponent>
  );
}
