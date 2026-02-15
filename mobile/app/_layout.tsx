import "../global.css";
import React, { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/components/Toast";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { GroupsProvider } from "@/hooks/useGroups";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  usePushNotifications();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)" || segments[0] === "auth";

    if (!user && !inAuthGroup) {
      router.replace("/auth/sign-in");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <View className="items-center gap-4">
          <View className="w-20 h-20 bg-primary rounded-2xl items-center justify-center">
            <Text className="text-3xl font-bold text-primary-foreground">S</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">Split Easy</Text>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthGuard>
          <GroupsProvider>
            <Slot />
          </GroupsProvider>
        </AuthGuard>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
