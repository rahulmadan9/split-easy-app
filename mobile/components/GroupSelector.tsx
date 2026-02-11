import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { BottomSheet } from './BottomSheet';
import { useCurrentGroup } from '../hooks/useCurrentGroup';

export interface GroupSelectorProps {
  className?: string;
}

export function GroupSelector({ className = '' }: GroupSelectorProps) {
  const { groups, currentGroup, setCurrentGroupId } = useCurrentGroup();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectGroup = (groupId: string) => {
    setCurrentGroupId(groupId);
    setIsOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        className={`flex-row items-center justify-between bg-card border border-border rounded-lg px-4 py-3 ${className}`}
      >
        <View className="flex-row items-center gap-3">
          {currentGroup && (
            <View className="w-10 h-10 bg-primary rounded-full items-center justify-center">
              <Text className="text-white font-semibold text-lg">
                {currentGroup.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text className="text-sm text-muted-foreground">Current Group</Text>
            <Text className="text-base font-semibold text-foreground">
              {currentGroup?.name || 'Select a group'}
            </Text>
          </View>
        </View>
        <ChevronDown size={20} color="#64748b" />
      </Pressable>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Select Group"
        snapPoints={['60%', '90%']}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {groups.map((group) => (
            <Pressable
              key={group.id}
              onPress={() => handleSelectGroup(group.id)}
              className="flex-row items-center justify-between py-4 border-b border-border"
            >
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-12 h-12 bg-primary rounded-full items-center justify-center">
                  <Text className="text-white font-semibold text-xl">
                    {group.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">
                    {group.name}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Created by {group.createdBy}
                  </Text>
                </View>
              </View>
              {currentGroup?.id === group.id && (
                <Check size={24} color="#6366f1" />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
    </>
  );
}
