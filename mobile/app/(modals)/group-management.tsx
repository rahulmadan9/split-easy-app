import React, { useState } from "react";
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
  Copy,
  Share2,
  Shield,
  ShieldOff,
  UserMinus,
  LogOut,
  Edit3,
  Check,
  X,
} from "lucide-react-native";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentGroup } from "@/hooks/useCurrentGroup";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useGroups } from "@/hooks/useGroups";

export default function GroupManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentGroup, currentGroupId } = useCurrentGroup();
  const {
    members,
    isAdmin,
    promoteMember,
    demoteMember,
    kickMember,
  } = useGroupMembers(currentGroupId);
  const { leaveGroup, updateGroupName } = useGroups();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(currentGroup?.name || "");
  const [savingName, setSavingName] = useState(false);

  const handleCopyCode = async () => {
    if (!currentGroup?.inviteCode) return;
    await Clipboard.setStringAsync(currentGroup.inviteCode);
    Toast.show({
      type: "success",
      text1: "Copied!",
      text2: "Invite code copied to clipboard",
    });
  };

  const handleShare = async () => {
    if (!currentGroup?.inviteCode) return;
    try {
      await Share.share({
        message: `Join "${currentGroup.name}" on Split Easy! Invite code: ${currentGroup.inviteCode}\n\nOpen: spliteasy://join/${currentGroup.inviteCode}`,
      });
    } catch {
      // User cancelled
    }
  };

  const handleSaveName = async () => {
    if (!currentGroupId || !newName.trim()) return;

    setSavingName(true);
    try {
      await updateGroupName(currentGroupId, newName.trim());
      setEditingName(false);
      Toast.show({
        type: "success",
        text1: "Updated",
        text2: "Group name updated successfully",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update name";
      Toast.show({ type: "error", text1: "Error", text2: message });
    } finally {
      setSavingName(false);
    }
  };

  const handlePromote = (memberId: string, memberName: string) => {
    Alert.alert(
      "Promote Member",
      `Make ${memberName} an admin?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Promote",
          onPress: async () => {
            try {
              await promoteMember(memberId);
              Toast.show({
                type: "success",
                text1: "Promoted",
                text2: `${memberName} is now an admin`,
              });
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to promote member",
              });
            }
          },
        },
      ]
    );
  };

  const handleDemote = (memberId: string, memberName: string) => {
    Alert.alert(
      "Demote Member",
      `Remove admin rights from ${memberName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Demote",
          style: "destructive",
          onPress: async () => {
            try {
              await demoteMember(memberId);
              Toast.show({
                type: "success",
                text1: "Demoted",
                text2: `${memberName} is now a regular member`,
              });
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to demote member",
              });
            }
          },
        },
      ]
    );
  };

  const handleKick = (memberId: string, memberName: string) => {
    Alert.alert(
      "Remove Member",
      `Remove ${memberName} from the group? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await kickMember(memberId);
              Toast.show({
                type: "success",
                text1: "Removed",
                text2: `${memberName} has been removed`,
              });
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to remove member",
              });
            }
          },
        },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group? You will need an invite code to rejoin.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              if (currentGroupId) {
                await leaveGroup(currentGroupId);
                Toast.show({
                  type: "success",
                  text1: "Left Group",
                  text2: "You have left the group",
                });
                router.back();
              }
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Failed to leave group";
              Toast.show({
                type: "error",
                text1: "Error",
                text2: message,
              });
            }
          },
        },
      ]
    );
  };

  if (!currentGroup || currentGroup.isPersonal) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center" edges={["bottom"]}>
        <Text className="text-muted-foreground">
          No group selected or personal group
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Group Name */}
        <Animated.View entering={FadeIn.duration(400)} className="px-4 pt-4 mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">
            Group Name
          </Text>
          {editingName ? (
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <Input
                  value={newName}
                  onChangeText={setNewName}
                  autoFocus
                />
              </View>
              <Pressable
                onPress={handleSaveName}
                disabled={savingName}
                className="p-3 bg-primary rounded-lg"
              >
                <Check size={18} color="#ffffff" />
              </Pressable>
              <Pressable
                onPress={() => {
                  setEditingName(false);
                  setNewName(currentGroup.name);
                }}
                className="p-3 bg-muted rounded-lg"
              >
                <X size={18} color="#64748b" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                if (isAdmin) {
                  setEditingName(true);
                  setNewName(currentGroup.name);
                }
              }}
              className="flex-row items-center justify-between bg-card border border-border rounded-lg px-4 py-3"
            >
              <Text className="text-base text-foreground font-medium">
                {currentGroup.name}
              </Text>
              {isAdmin && <Edit3 size={16} color="#64748b" />}
            </Pressable>
          )}
        </Animated.View>

        {/* Invite Code */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          className="px-4 mb-6"
        >
          <Text className="text-sm font-medium text-foreground mb-2">
            Invite Code
          </Text>
          <Card className="p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-primary tracking-[6px]">
                {currentGroup.inviteCode || "N/A"}
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={handleCopyCode}
                  className="p-2 bg-muted rounded-lg"
                >
                  <Copy size={18} color="#64748b" />
                </Pressable>
                <Pressable
                  onPress={handleShare}
                  className="p-2 bg-primary rounded-lg"
                >
                  <Share2 size={18} color="#ffffff" />
                </Pressable>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Members */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          className="px-4 mb-6"
        >
          <Text className="text-sm font-medium text-foreground mb-2">
            Members ({members.length})
          </Text>

          <View className="gap-2">
            {members.map((member, index) => {
              const isCurrentUser = member.userId === user?.uid;
              const isMemberAdmin = member.role === "admin";

              return (
                <Animated.View
                  key={member.userId}
                  entering={FadeInDown.delay(250 + index * 50).duration(300)}
                >
                  <Card className="p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 flex-1">
                        <View className="w-10 h-10 bg-primary rounded-full items-center justify-center">
                          <Text className="text-primary-foreground font-bold">
                            {member.userName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            <Text className="text-base font-medium text-foreground">
                              {member.userName}
                            </Text>
                            {isCurrentUser && (
                              <Text className="text-xs text-muted-foreground">
                                (You)
                              </Text>
                            )}
                          </View>
                          {isMemberAdmin && (
                            <Badge variant="default">Admin</Badge>
                          )}
                        </View>
                      </View>

                      {/* Admin Actions */}
                      {isAdmin && !isCurrentUser && (
                        <View className="flex-row gap-2">
                          {isMemberAdmin ? (
                            <Pressable
                              onPress={() =>
                                handleDemote(
                                  member.userId,
                                  member.userName
                                )
                              }
                              className="p-2 bg-muted rounded-lg"
                            >
                              <ShieldOff size={16} color="#64748b" />
                            </Pressable>
                          ) : (
                            <Pressable
                              onPress={() =>
                                handlePromote(
                                  member.userId,
                                  member.userName
                                )
                              }
                              className="p-2 bg-muted rounded-lg"
                            >
                              <Shield size={16} color="#6366f1" />
                            </Pressable>
                          )}
                          <Pressable
                            onPress={() =>
                              handleKick(
                                member.userId,
                                member.userName
                              )
                            }
                            className="p-2 bg-red-50 rounded-lg"
                          >
                            <UserMinus size={16} color="#ef4444" />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </Card>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Leave Group */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          className="px-4"
        >
          <Button
            onPress={handleLeave}
            variant="destructive"
            size="lg"
            className="w-full"
          >
            <View className="flex-row items-center gap-2">
              <LogOut size={18} color="#ffffff" />
              <Text className="text-base font-semibold text-white">
                Leave Group
              </Text>
            </View>
          </Button>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
