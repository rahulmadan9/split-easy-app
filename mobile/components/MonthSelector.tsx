import React, { useRef, useEffect } from 'react';
import { ScrollView, Pressable, Text, View } from 'react-native';

export interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      shortLabel: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  }).reverse();

  useEffect(() => {
    const selectedIndex = months.findIndex(m => m.value === selectedMonth);
    if (selectedIndex !== -1 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: selectedIndex * 90 - 50,
        animated: true,
      });
    }
  }, [selectedMonth]);

  return (
    <View className="mb-4">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {months.map((month) => {
          const isSelected = month.value === selectedMonth;
          return (
            <Pressable
              key={month.value}
              onPress={() => onMonthChange(month.value)}
              className={`
                px-4 py-2.5 rounded-full mr-2
                ${isSelected ? 'bg-primary' : 'bg-muted'}
              `}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                className={`
                  font-semibold text-sm
                  ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}
                `}
              >
                {month.shortLabel}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
