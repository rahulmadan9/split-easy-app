import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import {
  Phone,
  Users,
  Copy,
  Share2,
  LogOut,
  Settings,
  ChevronRight,
  Pencil,
  Check,
  X,
} from "lucide-react-native";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Input } from "@/components/Input";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";
import { useCurrentGroup } from "@/hooks/useCurrentGroup";
import { useGroupMembers } from "@/hooks/useGroupMembers";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { currentProfile, updateDisplayName, updatingDisplayName } = useProfiles();
  const { currentGroup, currentGroupId } = useCurrentGroup();
  const { members, currentUserRole } = useGroupMembers(currentGroupId);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const currentName = currentProfile?.display_name || "";
  const isNameChanged = nameDraft.trim() !== currentName;

  useEffect(() => {
    if (!isEditingName) {
      setNameDraft(currentName);
    }
  }, [currentName, isEditingName]);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            Toast.show({
              type: "success",
              text1: "Signed Out",
              text2: "See you soon!",
            });
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Failed to sign out";
            Toast.show({ type: "error", text1: "Error", text2: message });
          }
        },
      },
    ]);
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
        message: `Join my group "${currentGroup?.name}" on Split Easy! Use invite code: ${code}\n\nOr open: spliteasy://join/${code}`,
      });
    } catch {
      // User cancelled
    }
  };

  const handleStartEditingName = () => {
    setNameDraft(currentName);
    setIsEditingName(true);
  };

  const handleCancelEditingName = () => {
    setNameDraft(currentName);
    setIsEditingName(false);
  };

  const handleSaveDisplayName = async () => {
    if (!isNameChanged) {
      setIsEditingName(false);
      return;
    }

    try {
      await updateDisplayName(nameDraft);
      Toast.show({
        type: "success",
        text1: "Name Updated",
        text2: "Your display name was saved",
      });
      setIsEditingName(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update name";
      Toast.show({ type: "error", text1: "Error", text2: message });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <Animated.View
          entering={FadeIn.duration(400)}
          className="items-center px-4 pt-4 pb-6"
        >
          <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-3">
            <Text className="text-3xl font-bold text-primary-foreground">
              {currentProfile?.display_name?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>
          {isEditingName ? (
            <View className="w-full gap-2">
              <Input
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="Enter your name"
                maxLength={50}
                autoFocus
              />
              <View className="flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onPress={handleCancelEditingName}
                  disabled={updatingDisplayName}
                >
                  <View className="flex-row items-center gap-1">
                    <X size={16} color="#0f172a" />
                    <Text className="text-foreground font-semibold">Cancel</Text>
                  </View>
                </Button>
                <Button
                  className="flex-1"
                  onPress={() => void handleSaveDisplayName()}
                  disabled={updatingDisplayName || !isNameChanged}
                >
                  <View className="flex-row items-center gap-1">
                    <Check size={16} color="#ffffff" />
                    <Text className="text-primary-foreground font-semibold">
                      {updatingDisplayName ? "Saving..." : "Save"}
                    </Text>
                  </View>
                </Button>
              </View>
            </View>
          ) : (
            <View className="flex-row items-center gap-2">
              <Text className="text-xl font-bold text-foreground">
                {currentName || "User"}
              </Text>
              <Pressable
                onPress={handleStartEditingName}
                className="p-1 rounded-md"
                accessibilityRole="button"
                accessibilityLabel="Edit display name"
              >
                <Pencil size={16} color="#64748b" />
              </Pressable>
            </View>
          )}
          {currentProfile?.phone_number && (
            <View className="flex-row items-center gap-1 mt-1">
              <Phone size={14} color="#64748b" />
              <Text className="text-sm text-muted-foreground">
                {currentProfile.phone_number}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Current Group Info */}
        {currentGroup && !currentGroup.isPersonal && (
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            className="px-4 mb-4"
          >
            <Text className="text-base font-semibold text-foreground mb-3">
              Current Group
            </Text>
            <Card className="p-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-primary rounded-full items-center justify-center">
                    <Text className="text-primary-foreground font-bold">
                      {currentGroup.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-base font-semibold text-foreground">
                      {currentGroup.name}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {members.length} member{members.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
                {currentUserRole === "admin" && (
                  <Badge variant="default">Admin</Badge>
                )}
              </View>

              {/* Invite Code */}
              {currentGroup.inviteCode && (
                <View className="bg-muted rounded-lg p-3 mb-3">
                  <Text className="text-xs text-muted-foreground mb-1">
                    Invite Code
                  </Text>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-bold text-foreground tracking-[4px]">
                      {currentGroup.inviteCode}
                    </Text>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() =>
                          handleCopyCode(currentGroup.inviteCode)
                        }
                        className="p-2 bg-card rounded-lg border border-border"
                      >
                        <Copy size={16} color="#64748b" />
                      </Pressable>
                      <Pressable
                        onPress={() =>
                          handleShare(currentGroup.inviteCode)
                        }
                        className="p-2 bg-primary rounded-lg"
                      >
                        <Share2 size={16} color="#ffffff" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}

              {/* Members Preview */}
              <Text className="text-sm font-medium text-foreground mb-2">
                Members
              </Text>
              {members.slice(0, 5).map((member) => (
                <View
                  key={member.userId}
                  className="flex-row items-center justify-between py-2 border-b border-border"
                >
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 bg-muted rounded-full items-center justify-center">
                      <Text className="text-sm font-semibold text-muted-foreground">
                        {member.userName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text className="text-sm text-foreground">
                      {member.userName}
                      {member.userId === user?.uid ? " (You)" : ""}
                    </Text>
                  </View>
                  {member.role === "admin" && (
                    <Badge variant="default">Admin</Badge>
                  )}
                </View>
              ))}
              {members.length > 5 && (
                <Text className="text-sm text-muted-foreground text-center mt-2">
                  +{members.length - 5} more
                </Text>
              )}

              {/* Manage Group Button */}
              {currentUserRole === "admin" && (
                <Pressable
                  onPress={() => router.push("/(modals)/group-management")}
                  className="flex-row items-center justify-between mt-3 pt-3 border-t border-border"
                >
                  <View className="flex-row items-center gap-2">
                    <Settings size={16} color="#6366f1" />
                    <Text className="text-sm font-medium text-primary">
                      Manage Group
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#6366f1" />
                </Pressable>
              )}
            </Card>
          </Animated.View>
        )}

        {/* Sign Out */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          className="px-4 mt-4"
        >
          <Button
            onPress={handleSignOut}
            variant="destructive"
            size="lg"
            className="w-full"
          >
            <View className="flex-row items-center gap-2">
              <LogOut size={18} color="#ffffff" />
              <Text className="text-base font-semibold text-white">
                Sign Out
              </Text>
            </View>
          </Button>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
