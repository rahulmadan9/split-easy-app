import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { FileQuestion } from "lucide-react-native";
import { Button } from "@/components/Button";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
      <Animated.View entering={FadeIn.duration(500)} className="items-center">
        <View className="w-20 h-20 bg-muted rounded-full items-center justify-center mb-4">
          <FileQuestion size={40} color="#64748b" />
        </View>

        <Text className="text-2xl font-bold text-foreground text-center mb-2">
          Page Not Found
        </Text>
        <Text className="text-base text-muted-foreground text-center mb-8">
          The page you are looking for does not exist or has been moved.
        </Text>

        <Button
          onPress={() => router.replace("/(tabs)")}
          size="lg"
          className="w-full"
        >
          Go Back Home
        </Button>
      </Animated.View>
    </SafeAreaView>
  );
}
