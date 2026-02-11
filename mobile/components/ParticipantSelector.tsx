import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Check } from 'lucide-react-native';
import { Input } from './Input';

export interface Member {
  id: string;
  name: string;
  email: string;
}

export interface ParticipantSelectorProps {
  members: Member[];
  selectedIds: string[];
  onToggle: (memberId: string) => void;
  splitType: 'equal' | 'custom';
  totalAmount: number;
  customAmounts: Record<string, number>;
  onCustomAmountChange: (memberId: string, amount: number) => void;
  currentUserId: string;
}

export function ParticipantSelector({
  members,
  selectedIds,
  onToggle,
  splitType,
  totalAmount,
  customAmounts,
  onCustomAmountChange,
  currentUserId,
}: ParticipantSelectorProps) {
  const selectedCount = selectedIds.length;
  const perPersonAmount = selectedCount > 0 ? totalAmount / selectedCount : 0;

  return (
    <View>
      <Text className="text-sm font-medium text-foreground mb-3">
        Split with ({selectedIds.length} selected)
      </Text>

      {members.map((member) => {
        const isSelected = selectedIds.includes(member.id);
        const isCurrentUser = member.id === currentUserId;

        return (
          <View key={member.id} className="mb-3">
            <Pressable
              onPress={() => onToggle(member.id)}
              className={`
                flex-row items-center justify-between p-4 rounded-lg border
                ${isSelected ? 'bg-primary/10 border-primary' : 'bg-card border-border'}
              `}
            >
              <View className="flex-row items-center gap-3 flex-1">
                <View
                  className={`
                    w-10 h-10 rounded-full items-center justify-center
                    ${isSelected ? 'bg-primary' : 'bg-muted'}
                  `}
                >
                  <Text
                    className={`
                      font-semibold text-base
                      ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}
                    `}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="text-base font-medium text-foreground">
                    {member.name} {isCurrentUser && '(You)'}
                  </Text>
                  {splitType === 'equal' && isSelected && (
                    <Text className="text-sm text-muted-foreground mt-0.5">
                      ${perPersonAmount.toFixed(2)}
                    </Text>
                  )}
                </View>
              </View>

              {isSelected && (
                <View className="w-6 h-6 bg-primary rounded-full items-center justify-center">
                  <Check size={16} color="#ffffff" />
                </View>
              )}
            </Pressable>

            {splitType === 'custom' && isSelected && (
              <View className="mt-2 pl-4">
                <Input
                  placeholder="Amount"
                  keyboardType="numeric"
                  value={customAmounts[member.id]?.toString() || ''}
                  onChangeText={(text) => {
                    const amount = parseFloat(text) || 0;
                    onCustomAmountChange(member.id, amount);
                  }}
                  className="bg-background"
                />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
