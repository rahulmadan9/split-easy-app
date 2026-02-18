import React from "react";
import { Stack } from "expo-router";
import { colors } from "@/lib/colors";

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: "modal",
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 17,
          color: colors.foreground,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="create-group"
        options={{ title: "Create Group" }}
      />
      <Stack.Screen
        name="join-group"
        options={{ title: "Join Group" }}
      />
      <Stack.Screen
        name="profile"
        options={{ title: "Profile" }}
      />
      <Stack.Screen
        name="group-management"
        options={{ title: "Group Management" }}
      />
    </Stack>
  );
}
