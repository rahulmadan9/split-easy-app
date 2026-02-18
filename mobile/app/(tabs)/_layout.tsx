import React from "react";
import { View, Text, Pressable } from "react-native";
import { Tabs, useRouter } from "expo-router";
import {
  Home,
  IndianRupee,
  PlusCircle,
  Repeat,
  Receipt,
  User,
} from "lucide-react-native";
import { colors } from "@/lib/colors";

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
          shadowColor: colors.border,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 1,
          shadowRadius: 0,
          elevation: 1,
        },
        headerTitleStyle: {
          fontWeight: "700",
          fontSize: 18,
          color: colors.foreground,
        },
        headerRight: () => (
          <Pressable
            onPress={() => router.push("/(modals)/profile")}
            className="mr-4"
          >
            <View className="w-9 h-9 bg-primary rounded-full items-center justify-center">
              <User size={18} color={colors.primaryForeground} />
            </View>
          </Pressable>
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: () => (
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">Split Easy</Text>
            </View>
          ),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="balance"
        options={{
          title: "Balance",
          tabBarIcon: ({ color, size }) => (
            <IndianRupee size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
          tabBarIcon: ({ color, size }) => (
            <PlusCircle size={size + 4} color={colors.primary} />
          ),
          tabBarLabel: ({ focused }) => (
            <Text
              className={`text-xs font-semibold ${
                focused ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Add
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="recurring"
        options={{
          title: "Recurring",
          tabBarIcon: ({ color, size }) => <Repeat size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
