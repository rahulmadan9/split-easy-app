import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import {
  Users,
  Plus,
  UserPlus,
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle,
} from "lucide-react-native";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { GroupSelector } from "@/components/GroupSelector";
import { EmptyState } from "@/components/EmptyState";
import { useProfiles } from "@/hooks/useProfiles";
import { useCurrentGroup } from "@/hooks/useCurrentGroup";
import { useGroups } from "@/hooks/useGroups";
import { useGroupBalance } from "@/hooks/useGroupBalance";

const formatINR = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export default function HomeScreen() {
  const router = useRouter();
  const { currentProfile, loading: profileLoading } = useProfiles();
  const { currentGroup, currentGroupId, groups, loading: groupsLoading } =
    useCurrentGroup();
  const { myBalance, loading: balanceLoading } = useGroupBalance(currentGroupId);

  const loading = profileLoading || groupsLoading;
  const nonPersonalGroups = groups.filter((g) => !g.isPersonal);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        <Animated.View entering={FadeIn.duration(500)} className="px-4 pt-4">
          <Text className="text-2xl font-bold text-foreground">
            Hello, {currentProfile?.display_name || "there"}
          </Text>
          <Text className="text-base text-muted-foreground mt-1">
            Here is your expense summary
          </Text>
        </Animated.View>

        {/* Group Selector */}
        <Animated.View entering={FadeIn.delay(100)} className="px-4 mt-4">
          <GroupSelector />
        </Animated.View>

        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} className="px-4 mt-4">
          <Card className="bg-primary p-5">
            <Text className="text-primary-foreground/70 text-sm font-medium mb-1">
              Your Balance
            </Text>
            {balanceLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text className="text-3xl font-bold text-primary-foreground">
                  {formatINR(Math.abs(myBalance))}
                </Text>
                <View className="flex-row items-center mt-2">
                  {myBalance > 0 ? (
                    <>
                      <ArrowUpRight size={18} color="#86efac" />
                      <Text className="text-green-300 font-medium ml-1">
                        You are owed
                      </Text>
                    </>
                  ) : myBalance < 0 ? (
                    <>
                      <ArrowDownLeft size={18} color="#fca5a5" />
                      <Text className="text-red-300 font-medium ml-1">
                        You owe
                      </Text>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} color="#86efac" />
                      <Text className="text-green-300 font-medium ml-1">
                        All settled!
                      </Text>
                    </>
                  )}
                </View>
              </>
            )}
          </Card>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          className="px-4 mt-6"
        >
          <Text className="text-lg font-semibold text-foreground mb-3">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push("/(modals)/create-group")}
              className="flex-1 bg-card border border-border rounded-2xl p-4 items-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mb-2">
                <Plus size={24} color="#6366f1" />
              </View>
              <Text className="text-sm font-semibold text-foreground text-center">
                Create Group
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(modals)/join-group")}
              className="flex-1 bg-card border border-border rounded-2xl p-4 items-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mb-2">
                <UserPlus size={24} color="#6366f1" />
              </View>
              <Text className="text-sm font-semibold text-foreground text-center">
                Join Group
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Groups List */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          className="px-4 mt-6"
        >
          <Text className="text-lg font-semibold text-foreground mb-3">
            Your Groups
          </Text>

          {nonPersonalGroups.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No groups yet"
              description="Create or join a group to start splitting expenses"
            />
          ) : (
            <View className="gap-3">
              {nonPersonalGroups.map((group, index) => (
                <Animated.View
                  key={group.id}
                  entering={FadeInDown.delay(450 + index * 80).duration(400)}
                >
                  <Pressable
                    onPress={() => {
                      /* group is selectable via GroupSelector */
                    }}
                    className={`bg-card border rounded-2xl p-4 flex-row items-center gap-3 ${
                      currentGroup?.id === group.id
                        ? "border-primary"
                        : "border-border"
                    }`}
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                  >
                    <View className="w-12 h-12 bg-primary rounded-full items-center justify-center">
                      <Text className="text-primary-foreground font-bold text-xl">
                        {group.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {group.name}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        Created by {group.createdByName}
                      </Text>
                    </View>
                    {currentGroup?.id === group.id && (
                      <View className="bg-primary/10 px-3 py-1 rounded-full">
                        <Text className="text-xs font-semibold text-primary">
                          Active
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
