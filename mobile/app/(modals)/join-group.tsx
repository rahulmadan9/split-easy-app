import React, { useState } from "react";
import { View, Text, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { UserPlus } from "lucide-react-native";
import { Button } from "@/components/Button";
import { useGroups } from "@/hooks/useGroups";
import { useCurrentGroup } from "@/hooks/useCurrentGroup";

export default function JoinGroupScreen() {
  const router = useRouter();
  const { joinGroupByCode } = useGroups();
  const { setCurrentGroup } = useCurrentGroup();

  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 6) {
      Toast.show({
        type: "error",
        text1: "Invalid Code",
        text2: "Please enter a 6-character invite code",
      });
      return;
    }

    setJoining(true);
    try {
      const groupId = await joinGroupByCode(code);
      await setCurrentGroup(groupId);

      Toast.show({
        type: "success",
        text1: "Joined Group",
        text2: "You have successfully joined the group",
      });

      router.back();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to join group";
      Toast.show({ type: "error", text1: "Error", text2: message });
    } finally {
      setJoining(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1 px-4 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeIn.duration(400)}>
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-3">
              <UserPlus size={32} color="#6366f1" />
            </View>
            <Text className="text-xl font-bold text-foreground text-center">
              Join a Group
            </Text>
            <Text className="text-sm text-muted-foreground text-center mt-1">
              Enter the 6-character invite code shared by your group admin
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-foreground mb-2">
              Invite Code
            </Text>
            <TextInput
              className="bg-card border border-border rounded-lg px-4 py-4 text-2xl text-foreground text-center tracking-[8px] font-bold uppercase"
              placeholder="ABCDEF"
              placeholderTextColor="#94a3b8"
              value={inviteCode}
              onChangeText={(text) =>
                setInviteCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              maxLength={6}
              autoFocus
              autoCapitalize="characters"
            />
          </View>

          <Button
            onPress={handleJoin}
            loading={joining}
            disabled={inviteCode.trim().length !== 6}
            size="lg"
            className="w-full"
          >
            Join Group
          </Button>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
