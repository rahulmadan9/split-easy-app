import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { RecaptchaVerifier, ConfirmationResult } from "firebase/auth";
import { auth } from "@/integrations/firebase/config";
import { createUserProfile } from "@/integrations/firebase/profiles";
import { ChevronDown } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signInWithPhone, verifyOTP } = useFirebaseAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [showNameField, setShowNameField] = useState(false);
  const [savedDisplayName, setSavedDisplayName] = useState<string>("");
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaWidgetId = useRef<number | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Load saved display name from localStorage
  useEffect(() => {
    const lastName = localStorage.getItem('spliteasy_lastDisplayName');
    if (lastName) {
      setSavedDisplayName(lastName);
      setShowNameField(true); // Auto-expand for returning users
    }
  }, []);

  // Pre-fill name when field expands and saved name exists
  useEffect(() => {
    if (showNameField && savedDisplayName && !displayName) {
      setDisplayName(savedDisplayName);
    }
  }, [showNameField, savedDisplayName]);

  // Cleanup only on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (error) {
          console.log('Error clearing reCAPTCHA:', error);
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  // Initialize reCAPTCHA verifier (lazy initialization)
  const initializeRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }

    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          toast.error('reCAPTCHA expired. Please try again');
        }
      });
      recaptchaVerifierRef.current = verifier;
      return verifier;
    } catch (error) {
      console.error('Error initializing reCAPTCHA:', error);
      throw new Error('Failed to initialize reCAPTCHA. Please refresh the page.');
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p className="text-sm text-muted-foreground">Restoring your session…</p>
      </div>
    );
  }

  // While redirecting away from /auth
  if (user) return null;

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Initialize or get existing reCAPTCHA verifier
      const verifier = initializeRecaptcha();

      // Format phone number to E.164 format (must include country code)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

      const result = await signInWithPhone(formattedPhone, verifier);
      setConfirmationResult(result);
      setOtpSent(true);
      toast.success("OTP sent to your phone!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send OTP";
      toast.error(errorMessage);

      // Reset reCAPTCHA on error
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch (e) {
          console.log('Error clearing reCAPTCHA:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!confirmationResult) {
        throw new Error('No confirmation result available');
      }

      const name = displayName.trim() || phoneNumber;
      await verifyOTP(confirmationResult, otp, name);

      // Create user profile in Firestore
      if (auth.currentUser) {
        await createUserProfile(auth.currentUser);
      }

      // Save display name to localStorage for returning users
      if (displayName.trim()) {
        localStorage.setItem('spliteasy_lastDisplayName', displayName.trim());
      }

      toast.success("Successfully logged in!");
      navigate("/");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to verify OTP";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {otpSent ? "Verify OTP" : "Sign in with Phone"}
          </CardTitle>
          <CardDescription>
            {otpSent
              ? "Enter the OTP sent to your phone"
              : "Enter your phone number to receive an OTP"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <Collapsible open={showNameField} onOpenChange={setShowNameField}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-between text-muted-foreground h-10 px-3"
                  >
                    <span className="text-sm flex items-center gap-2">
                      Add your name (optional)
                      {savedDisplayName && <Badge variant="secondary" className="text-xs">Saved</Badge>}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showNameField ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </CollapsibleContent>
              </Collapsible>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  pattern="[0-9]{10}"
                  title="Please enter a valid 10-digit phone number"
                />
                <p className="text-xs text-muted-foreground">
                  Enter 10-digit mobile number (India +91)
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  title="Please enter the 6-digit OTP"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setConfirmationResult(null);
                  // Clear reCAPTCHA to allow resending
                  if (recaptchaVerifierRef.current) {
                    try {
                      recaptchaVerifierRef.current.clear();
                      recaptchaVerifierRef.current = null;
                    } catch (e) {
                      console.log('Error clearing reCAPTCHA:', e);
                    }
                  }
                }}
                disabled={loading}
              >
                Back to Phone Number
              </Button>
            </form>
          )}
          <div id="recaptcha-container" className="mt-4 flex justify-center"></div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
