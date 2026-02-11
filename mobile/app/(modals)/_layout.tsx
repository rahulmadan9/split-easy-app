import React from "react";
import { Stack } from "expo-router";

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: "modal",
        headerShown: true,
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 17,
          color: "#0f172a",
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#f8fafc" },
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
