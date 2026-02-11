import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { CheckCircle, XCircle } from "lucide-react-native";
import { Button } from "@/components/Button";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { useCurrentGroup } from "@/hooks/useCurrentGroup";

export default function JoinByInviteCodeScreen() {
  const { inviteCode } = useLocalSearchParams<{ inviteCode: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { joinGroupByCode } = useGroups();
  const { setCurrentGroup } = useCurrentGroup();

  const [joining, setJoining] = useState(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Not authenticated, redirect to sign in first
      // The user will need to come back to this link after signing in
      router.replace("/auth/sign-in");
      return;
    }

    if (!inviteCode) {
      setStatus("error");
      setErrorMessage("No invite code provided");
      return;
    }

    joinGroup();
  }, [user, authLoading, inviteCode]);

  const joinGroup = async () => {
    if (!inviteCode) return;

    setJoining(true);
    setStatus("loading");
    try {
      const groupId = await joinGroupByCode(inviteCode.toUpperCase());
      await setCurrentGroup(groupId);
      setStatus("success");

      Toast.show({
        type: "success",
        text1: "Joined Group",
        text2: "You have successfully joined the group",
      });

      // Navigate to home after a short delay
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1500);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to join group";
      setStatus("error");
      setErrorMessage(message);

      Toast.show({
        type: "error",
        text1: "Could not join",
        text2: message,
      });
    } finally {
      setJoining(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
      <Animated.View entering={FadeIn.duration(400)} className="items-center">
        {status === "loading" && (
          <>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text className="text-lg font-semibold text-foreground mt-4">
              Joining group...
            </Text>
            <Text className="text-sm text-muted-foreground mt-1">
              Invite code: {inviteCode}
            </Text>
          </>
        )}

        {status === "success" && (
          <>
            <View className="w-20 h-20 bg-positive/10 rounded-full items-center justify-center mb-4">
              <CheckCircle size={44} color="#22c55e" />
            </View>
            <Text className="text-xl font-bold text-foreground text-center">
              Successfully Joined!
            </Text>
            <Text className="text-sm text-muted-foreground text-center mt-1">
              Redirecting to your group...
            </Text>
          </>
        )}

        {status === "error" && (
          <>
            <View className="w-20 h-20 bg-destructive/10 rounded-full items-center justify-center mb-4">
              <XCircle size={44} color="#ef4444" />
            </View>
            <Text className="text-xl font-bold text-foreground text-center">
              Could not join group
            </Text>
            <Text className="text-sm text-muted-foreground text-center mt-2 mb-6">
              {errorMessage}
            </Text>

            <View className="gap-3 w-full">
              <Button
                onPress={joinGroup}
                loading={joining}
                size="lg"
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                onPress={() => router.replace("/(tabs)")}
                variant="ghost"
                className="w-full"
              >
                Go Home
              </Button>
            </View>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
