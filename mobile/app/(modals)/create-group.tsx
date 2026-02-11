import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { Copy, Share2, CheckCircle, Users } from "lucide-react-native";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useGroups } from "@/hooks/useGroups";
import { useCurrentGroup } from "@/hooks/useCurrentGroup";

export default function CreateGroupScreen() {
  const router = useRouter();
  const { createGroup } = useGroups();
  const { setCurrentGroup } = useCurrentGroup();

  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<{
    id: string;
    inviteCode: string;
  } | null>(null);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Name",
        text2: "Please enter a group name",
      });
      return;
    }

    setCreating(true);
    try {
      const groupId = await createGroup(groupName.trim());

      // Fetch the invite code from the created group
      // The groups hook will update, but we need the invite code immediately
      // We'll set the group and show a success state
      await setCurrentGroup(groupId);

      // For now we need to get the invite code from the groups list
      // This is a slight delay, so we show a temporary state
      Toast.show({
        type: "success",
        text1: "Group Created",
        text2: `${groupName.trim()} is ready`,
      });

      setCreatedGroup({ id: groupId, inviteCode: "" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create group";
      Toast.show({ type: "error", text1: "Error", text2: message });
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Toast.show({
      type: "success",
      text1: "Copied!",
      text2: "Invite code copied to clipboard",
    });
  };

  const handleShare = async (code: string) => {
    try {
      await Share.share({
        message: `Join my group on Split Easy! Use invite code: ${code}\n\nOr open: spliteasy://join/${code}`,
      });
    } catch {
      // User cancelled share
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1 px-4 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        {!createdGroup ? (
          <Animated.View entering={FadeIn.duration(400)}>
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-3">
                <Users size={32} color="#6366f1" />
              </View>
              <Text className="text-xl font-bold text-foreground text-center">
                Create a New Group
              </Text>
              <Text className="text-sm text-muted-foreground text-center mt-1">
                Start splitting expenses with friends and roommates
              </Text>
            </View>

            <Input
              label="Group Name"
              placeholder="e.g., Apartment, Trip to Goa"
              value={groupName}
              onChangeText={setGroupName}
              autoFocus
              className="mb-6"
            />

            <Button
              onPress={handleCreate}
              loading={creating}
              disabled={!groupName.trim()}
              size="lg"
              className="w-full"
            >
              Create Group
            </Button>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(400)} className="items-center">
            <View className="w-16 h-16 bg-positive/10 rounded-full items-center justify-center mb-4">
              <CheckCircle size={36} color="#22c55e" />
            </View>

            <Text className="text-xl font-bold text-foreground text-center mb-2">
              Group Created!
            </Text>
            <Text className="text-sm text-muted-foreground text-center mb-6">
              Share the invite code with your group members
            </Text>

            <Card className="w-full p-5 items-center mb-6">
              <Text className="text-sm text-muted-foreground mb-2">
                Invite Code
              </Text>
              <Text className="text-3xl font-bold text-primary tracking-[8px] mb-4">
                {createdGroup.inviteCode || "------"}
              </Text>

              <View className="flex-row gap-3">
                <Button
                  onPress={() =>
                    handleCopyCode(createdGroup.inviteCode)
                  }
                  variant="outline"
                  size="sm"
                  disabled={!createdGroup.inviteCode}
                >
                  <View className="flex-row items-center gap-2">
                    <Copy size={16} color="#0f172a" />
                    <Text className="text-sm font-semibold text-foreground">
                      Copy
                    </Text>
                  </View>
                </Button>
                <Button
                  onPress={() =>
                    handleShare(createdGroup.inviteCode)
                  }
                  size="sm"
                  disabled={!createdGroup.inviteCode}
                >
                  <View className="flex-row items-center gap-2">
                    <Share2 size={16} color="#ffffff" />
                    <Text className="text-sm font-semibold text-primary-foreground">
                      Share
                    </Text>
                  </View>
                </Button>
              </View>
            </Card>

            <Button
              onPress={() => router.back()}
              variant="ghost"
              className="w-full"
            >
              Done
            </Button>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
