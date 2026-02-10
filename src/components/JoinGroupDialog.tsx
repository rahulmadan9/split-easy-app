import { useState } from "react";
import { useGroups } from "@/hooks/useGroups";
import { useCurrentGroup } from "@/hooks/useCurrentGroup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

interface JoinGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinGroupDialog({ open, onOpenChange }: JoinGroupDialogProps) {
  const { joinGroupByCode } = useGroups();
  const { setCurrentGroup } = useCurrentGroup();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length <= 6) {
      setCode(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Please enter a valid 6-character invite code");
      return;
    }

    setLoading(true);
    try {
      const result = await joinGroupByCode(code);
      if (result && result.id) {
        setCurrentGroup(result.id);
        toast.success(`Joined group "${result.name}" successfully!`);
        handleClose(false);
      }
    } catch (error) {
      toast.error("Failed to join group. Check the invite code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setCode("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Join Group
          </DialogTitle>
          <DialogDescription>
            Enter the 6-character invite code to join an existing group.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="invite-code" className="text-sm font-medium">
              Invite Code
            </label>
            <Input
              id="invite-code"
              placeholder="ABC123"
              value={code}
              onChange={handleCodeChange}
              maxLength={6}
              className="text-center font-mono text-2xl tracking-widest uppercase"
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              {code.length}/6 characters
            </p>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || code.length !== 6}
          >
            {loading ? "Joining..." : "Join Group"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
