import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { Phone, Chrome } from "lucide-react-native";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { createUserProfile } from "@/lib/profiles";
import { auth } from "@/lib/firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";

type AuthStep = "initial" | "phone" | "otp" | "display-name";

export default function SignInScreen() {
  const { signInWithGoogle, signInWithPhone } = useFirebaseAuth();

  const [step, setStep] = useState<AuthStep>("initial");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("91")) return `+${cleaned}`;
    return `+91${cleaned}`;
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      "Development Build Required",
      "Google Sign-In requires a development build with native modules configured. Please use phone authentication for Expo Go, or create a development build for Google Sign-In.",
      [{ text: "OK" }]
    );
  };

  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) {
      Toast.show({
        type: "error",
        text1: "Invalid Phone Number",
        text2: "Please enter a valid 10-digit phone number",
      });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);

      // Note: RecaptchaVerifier requires a DOM element, which works in
      // Expo web but not in native. For native builds, use expo-dev-client
      // with @react-native-firebase/auth for proper phone auth.
      // This implementation works for Expo web and serves as a reference.
      const appVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });

      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        appVerifier
      );
      setConfirmationResult(result);
      setVerificationId(formattedPhone);
      setStep("otp");
      Toast.show({
        type: "success",
        text1: "OTP Sent",
        text2: `Verification code sent to ${formattedPhone}`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send OTP";
      Toast.show({ type: "error", text1: "Error", text2: message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Toast.show({
        type: "error",
        text1: "Invalid OTP",
        text2: "Please enter the 6-digit verification code",
      });
      return;
    }

    setLoading(true);
    try {
      if (confirmationResult) {
        const userCredential = await confirmationResult.confirm(otp);
        const user = userCredential.user;

        if (!user.displayName) {
          setStep("display-name");
          setLoading(false);
          return;
        }

        await createUserProfile(user);
        Toast.show({
          type: "success",
          text1: "Welcome back!",
          text2: `Signed in as ${user.displayName}`,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to verify OTP";
      Toast.show({ type: "error", text1: "Verification Failed", text2: message });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDisplayName = async () => {
    if (displayName.trim().length < 2) {
      Toast.show({
        type: "error",
        text1: "Invalid Name",
        text2: "Please enter a name with at least 2 characters",
      });
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const { updateProfile } = await import("firebase/auth");
        await updateProfile(user, { displayName: displayName.trim() });
        await user.reload();
        await createUserProfile(user);
        Toast.show({
          type: "success",
          text1: "Welcome!",
          text2: `Profile created as ${displayName.trim()}`,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to set name";
      Toast.show({ type: "error", text1: "Error", text2: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeIn.duration(600)} className="px-6">
            {/* Logo */}
            <View className="items-center mb-8">
              <View className="w-24 h-24 bg-primary rounded-3xl items-center justify-center mb-4">
                <Text className="text-4xl font-bold text-primary-foreground">
                  S
                </Text>
              </View>
              <Text className="text-3xl font-bold text-foreground">
                Welcome to Split Easy
              </Text>
              <Text className="text-base text-muted-foreground mt-2 text-center">
                Split expenses with roommates, friends, and family
              </Text>
            </View>

            {/* Initial Step */}
            {step === "initial" && (
              <Animated.View entering={FadeIn.delay(200)} className="gap-4">
                <Button
                  onPress={handleGoogleSignIn}
                  variant="outline"
                  size="lg"
                  className="w-full flex-row gap-3"
                >
                  <Chrome size={20} color="#0f172a" />
                  <Text className="text-base font-semibold text-foreground ml-2">
                    Continue with Google
                  </Text>
                </Button>

                <View className="flex-row items-center my-4">
                  <View className="flex-1 h-px bg-border" />
                  <Text className="mx-4 text-muted-foreground text-sm">or</Text>
                  <View className="flex-1 h-px bg-border" />
                </View>

                <Button
                  onPress={() => setStep("phone")}
                  size="lg"
                  className="w-full"
                >
                  <View className="flex-row items-center gap-2">
                    <Phone size={20} color="#ffffff" />
                    <Text className="text-base font-semibold text-primary-foreground ml-2">
                      Sign in with Phone
                    </Text>
                  </View>
                </Button>
              </Animated.View>
            )}

            {/* Phone Number Step */}
            {step === "phone" && (
              <Animated.View entering={SlideInRight.duration(300)} className="gap-4">
                <Text className="text-lg font-semibold text-foreground mb-2">
                  Enter your phone number
                </Text>

                <View className="flex-row items-center gap-2">
                  <View className="bg-muted rounded-lg px-4 py-3 border border-border">
                    <Text className="text-base text-foreground font-medium">
                      +91
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Input
                      placeholder="Phone number"
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      maxLength={10}
                      autoFocus
                    />
                  </View>
                </View>

                <Button
                  onPress={handleSendOtp}
                  loading={loading}
                  disabled={phoneNumber.length < 10}
                  size="lg"
                  className="w-full mt-2"
                >
                  Send OTP
                </Button>

                <Button
                  onPress={() => setStep("initial")}
                  variant="ghost"
                  className="w-full"
                >
                  Back
                </Button>

                {/* Hidden recaptcha container for web */}
                <View nativeID="recaptcha-container" />
              </Animated.View>
            )}

            {/* OTP Step */}
            {step === "otp" && (
              <Animated.View entering={SlideInRight.duration(300)} className="gap-4">
                <Text className="text-lg font-semibold text-foreground mb-1">
                  Enter verification code
                </Text>
                <Text className="text-sm text-muted-foreground mb-2">
                  We sent a 6-digit code to +91 {phoneNumber}
                </Text>

                <TextInput
                  className="bg-background border border-border rounded-lg px-4 py-4 text-2xl text-foreground text-center tracking-[12px] font-semibold"
                  placeholder="000000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={(text) => setOtp(text.replace(/\D/g, ""))}
                  maxLength={6}
                  autoFocus
                />

                <Button
                  onPress={handleVerifyOtp}
                  loading={loading}
                  disabled={otp.length !== 6}
                  size="lg"
                  className="w-full mt-2"
                >
                  Verify OTP
                </Button>

                <Button
                  onPress={() => {
                    setOtp("");
                    setStep("phone");
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Change phone number
                </Button>
              </Animated.View>
            )}

            {/* Display Name Step */}
            {step === "display-name" && (
              <Animated.View entering={SlideInRight.duration(300)} className="gap-4">
                <Text className="text-lg font-semibold text-foreground mb-1">
                  What should we call you?
                </Text>
                <Text className="text-sm text-muted-foreground mb-2">
                  This name will be visible to your group members
                </Text>

                <Input
                  placeholder="Your name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoFocus
                  autoCapitalize="words"
                />

                <Button
                  onPress={handleSetDisplayName}
                  loading={loading}
                  disabled={displayName.trim().length < 2}
                  size="lg"
                  className="w-full mt-2"
                >
                  Continue
                </Button>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
