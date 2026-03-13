import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LogOut,
  Lock,
  Trash2,
  X,
  ShieldCheck,
  Smartphone,
  ShieldAlert,
  Key,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { fetchMe, logout } from "@/features/auth/auth-slice";
import { fetchProfile, updateProfile } from "@/features/profile/profile-slice";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TwoFactorSetup } from "@/components/layout/two-factor-setup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { API_BASE_URL } from "@/lib/config";

export function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const profile = useSelector((state) => state.profile.profile);
  const updateStatus = useSelector((state) => state.profile.updateStatus);

  const [draftUsername, setDraftUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [message, setMessage] = useState("");

  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passError, setPassError] = useState("");
  const [tfaCode, setTfaCode] = useState("");
  const [isPassDialogOpen, setIsPassDialogOpen] = useState(false);

  const [deleteVerifyPassword, setDeleteVerifyPassword] = useState("");
  const [deleteTfaCode, setDeleteTfaCode] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [disableTfaCode, setDisableTfaCode] = useState("");
  const [disableError, setDisableError] = useState("");
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);

  const [backupCodes, setBackupCodes] = useState([]);
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  const username = isEditingUsername ? draftUsername : profile?.username || "";

  async function handleUpdate(event) {
    event.preventDefault();
    setMessage("");
    try {
      await dispatch(updateProfile({ username: username.trim() })).unwrap();
      await dispatch(fetchMe());
      setIsEditingUsername(false);
      setMessage("Profile updated.");
    } catch (err) {
      setMessage(err.message || "Failed to update profile.");
    }
  }

  async function handleTfaEnabled() {
    try {
      // Refresh both profile and auth state to reflect the new 2FA status
      await dispatch(fetchProfile()).unwrap();
      await dispatch(fetchMe()).unwrap();
      setMessage("Two-Factor Authentication enabled successfully.");
    } catch (err) {
      console.error("Failed to refresh profile after TFA setup", err);
    }
  }

  async function handleDisableTfa(e) {
    e.preventDefault();
    setDisableError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/tfa/disable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: disableTfaCode }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setDisableError(errorText || "Failed to disable 2FA");
        return;
      }

      await dispatch(fetchProfile()).unwrap();
      await dispatch(fetchMe()).unwrap();
      setIsDisableDialogOpen(false);
      setDisableTfaCode("");
      setMessage("Two-Factor Authentication has been disabled.");
    } catch (err) {
      setDisableError(err.message);
    }
  }

  async function handleFetchBackupCodes() {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/tfa/backup-codes`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setIsBackupDialogOpen(true);
    } catch (err) {
      setMessage("Failed to load backup codes.");
    }
  }
  const copyToClipboard = () => {
    const text = backupCodes.join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPassError("");

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            oldPassword: passwords.oldPassword,
            newPassword: passwords.newPassword,
            tfaCode: tfaCode,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        setPassError(errorText || "Failed to update password");
        return;
      }

      setIsPassDialogOpen(false);
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setTfaCode("");
      setMessage("Password updated successfully.");
    } catch (err) {
      setPassError(err.message);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: deleteVerifyPassword,
          tfaCode: deleteTfaCode,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setDeleteError(errorText || "Deletion failed");
        return;
      }

      dispatch(logout());
      navigate("/login", { replace: true });
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  const actions = (
    <div className="flex gap-2">
      <Button
        className="group rounded-xl"
        variant="default"
        onClick={() => navigate("/dashboard")}
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back
      </Button>
      <Button
        className="group rounded-xl hover:bg-red-600 hover:text-white"
        variant="default"
        onClick={() => {
          dispatch(logout());
          navigate("/login", { replace: true });
        }}
      >
        <LogOut className="mr-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        Logout
      </Button>
    </div>
  );

  return (
    <AppShell
      title="Account Settings"
      subtitle="Manage your profile and security."
      actions={actions}
    >
      <div className="mx-auto w-full max-w-xl space-y-6">
        {/* Public Profile Card */}
        <Card className="rounded-3xl border-zinc-200">
          <CardHeader>
            <CardTitle>Public Profile</CardTitle>
            <CardDescription>
              Update your display name and basic info.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleUpdate}>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  className="rounded-xl border-zinc-200 focus-visible:ring-black"
                  value={username}
                  onChange={(e) => {
                    setIsEditingUsername(true);
                    setDraftUsername(e.target.value);
                  }}
                />
              </div>
              <div className="space-y-2 text-muted-foreground opacity-70">
                <Label>Email Address</Label>
                <Input
                  className="rounded-xl"
                  value={profile?.email || ""}
                  disabled
                />
              </div>
              {message && (
                <p className="text-sm font-medium text-blue-600">{message}</p>
              )}
              <Button
                className="rounded-xl w-full"
                type="submit"
                disabled={updateStatus === "loading"}
              >
                {updateStatus === "loading" ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="rounded-3xl border-zinc-200">
          <CardHeader>
            <CardTitle>Security & Danger Zone</CardTitle>
            <CardDescription>Sensitive account actions.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {/* Change Password Dialog */}
            <Dialog
              open={isPassDialogOpen}
              onOpenChange={(open) => {
                setIsPassDialogOpen(open);
                if (!open) {
                  setPasswords({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setPassError("");
                  setTfaCode("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start rounded-xl border-zinc-200"
                >
                  <Lock className="mr-2 h-4 w-4" /> Change Password
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-zinc-200 shadow-2xl sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">
                    Update Password
                  </DialogTitle>
                  <DialogDescription>
                    Enter your current password to set a new one.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={handlePasswordChange}
                  className="space-y-4 py-2"
                >
                  <div className="space-y-1.5">
                    <Label>Current Password</Label>
                    <Input
                      type="password"
                      required
                      className="rounded-xl"
                      value={passwords.oldPassword}
                      onChange={(e) =>
                        setPasswords({
                          ...passwords,
                          oldPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      required
                      className="rounded-xl"
                      value={passwords.newPassword}
                      onChange={(e) =>
                        setPasswords({
                          ...passwords,
                          newPassword: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      required
                      className="rounded-xl"
                      value={passwords.confirmPassword}
                      onChange={(e) =>
                        setPasswords({
                          ...passwords,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                  </div>

                  {profile?.isTfaEnabled && (
                    <div className="space-y-2 pt-2 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-sm font-semibold flex items-center gap-2 text-blue-700">
                        <ShieldCheck className="h-4 w-4" />
                        Authenticator Code
                      </Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="000 000"
                        maxLength={6}
                        className="rounded-xl border-zinc-200 focus-visible:ring-blue-500 text-center font-mono text-lg tracking-widest"
                        value={tfaCode}
                        onChange={(e) =>
                          setTfaCode(e.target.value.replace(/\D/g, ""))
                        }
                        required
                      />
                    </div>
                  )}

                  {passError && (
                    <p className="text-sm font-medium text-red-600">
                      {passError}
                    </p>
                  )}

                  <DialogFooter className="pt-4 gap-2">
                    <DialogClose asChild>
                      <Button
                        type="button"
                        className="group rounded-xl bg-slate-900 text-white transition-all duration-300 hover:bg-black"
                      >
                        <X className="mr-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" />
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button
                      type="submit"
                      className="rounded-xl px-6"
                      disabled={profile?.isTfaEnabled && tfaCode.length !== 6}
                    >
                      Update Password
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {!profile?.isTfaEnabled ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start rounded-xl border-zinc-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Smartphone className="mr-2 h-4 w-4" /> Enable Two-Factor
                    Auth
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl border-zinc-200 shadow-2xl sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                      Setup Authenticator
                    </DialogTitle>
                    <DialogDescription>
                      Scan the QR code with an app like Google Authenticator or
                      Authy to secure your account.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-4">
                    <TwoFactorSetup
                      isEnabled={profile?.isTfaEnabled}
                      onEnabled={handleTfaEnabled}
                    />
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="ghost" className="rounded-xl">
                        Close
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <div className="space-y-3">
                {/* Status Indicator */}
                <div className="flex items-center justify-between px-4 py-3 text-sm font-medium text-green-700 bg-green-50 border border-green-100 rounded-xl">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Two-Factor Authentication is Active
                  </div>

                  {/* Backup Codes Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFetchBackupCodes}
                    className="h-8 text-xs font-semibold hover:bg-green-100"
                  >
                    <Key className="mr-1 h-3 w-3" /> Backup Codes
                  </Button>
                </div>

                {/* Disable 2FA Dialog */}
                <Dialog
                  open={isDisableDialogOpen}
                  onOpenChange={setIsDisableDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start rounded-xl border-zinc-200 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    >
                      <ShieldAlert className="mr-2 h-4 w-4" /> Disable
                      Two-Factor Auth
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl border-zinc-200 sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">
                        Disable 2FA
                      </DialogTitle>
                      <DialogDescription>
                        Enter your current authenticator code to turn off 2FA.
                        Your account will be less secure.
                      </DialogDescription>
                    </DialogHeader>
                    <form
                      onSubmit={handleDisableTfa}
                      className="space-y-4 py-2"
                    >
                      <div className="space-y-2">
                        <Label>Verification Code</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          className="rounded-xl text-center font-mono text-lg tracking-widest"
                          value={disableTfaCode}
                          onChange={(e) =>
                            setDisableTfaCode(e.target.value.replace(/\D/g, ""))
                          }
                          required
                        />
                      </div>
                      {disableError && (
                        <p className="text-sm font-medium text-red-600">
                          {disableError}
                        </p>
                      )}
                      <DialogFooter>
                        <Button
                          type="submit"
                          className="w-full rounded-xl bg-amber-600 hover:bg-amber-700"
                        >
                          Confirm Disable
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            <Dialog
              open={isBackupDialogOpen}
              onOpenChange={setIsBackupDialogOpen}
            >
              <DialogContent className="rounded-2xl border-zinc-200 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">
                    Your Backup Codes
                  </DialogTitle>
                  <DialogDescription>
                    Store these in a safe place. Each code can be used once if
                    you lose your device.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-2 py-4 font-mono text-sm">
                  {backupCodes.map((code, i) => (
                    <div
                      key={i}
                      className="p-2 bg-zinc-50 border border-zinc-100 rounded-lg text-center"
                    >
                      {code}
                    </div>
                  ))}
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={copyToClipboard}
                    className="rounded-xl flex-1"
                  >
                    {copied ? (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? "Copied!" : "Copy All"}
                  </Button>
                  <DialogClose asChild>
                    <Button className="rounded-xl flex-1">Done</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Delete Account Dialog */}
            <Dialog
              onOpenChange={() => {
                setDeleteVerifyPassword("");
                setDeleteTfaCode("");
                setDeleteError("");
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="group relative flex items-center justify-start gap-2 overflow-hidden rounded-xl border-zinc-200 text-red-500 bg-transparent px-4 py-2 transition-all hover:bg-red-500 hover:text-white hover:border-red-500"
                >
                  <span className="relative z-10 font-medium">
                    Delete Account
                  </span>
                  <div className="relative h-4 w-4 overflow-hidden">
                    <Trash2 className="absolute inset-0 h-4 w-4 transition-all duration-500 group-hover:translate-y-8 group-hover:opacity-0" />
                    <Trash2 className="absolute inset-0 h-4 w-4 -translate-y-8 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-106.25 border-zinc-200 shadow-2xl rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-red-700">
                    Destroy Account?
                  </DialogTitle>
                  <DialogDescription className="text-black">
                    This action is irreversible. Your profile
                    <span className="text-red-700"> {profile?.email} </span>
                    will be permanently purged.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-4">
                  <Label className="text-sm font-semibold">
                    Enter Password to Confirm
                  </Label>
                  <Input
                    type="password"
                    placeholder="Verify your identity"
                    className="rounded-xl border-zinc-200 focus-visible:ring-red-500"
                    value={deleteVerifyPassword}
                    onChange={(e) => setDeleteVerifyPassword(e.target.value)}
                  />
                  {deleteError && (
                    <p className="text-xs font-medium text-red-600 animate-pulse">
                      {deleteError}
                    </p>
                  )}
                </div>
                {profile?.isTfaEnabled && (
                  <div className="space-y-2 pb-4 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-sm font-semibold flex items-center gap-2 text-blue-700">
                      <ShieldCheck className="h-4 w-4" />
                      Authenticator Code
                    </Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="000 000"
                      maxLength={6}
                      className="rounded-xl border-zinc-200 focus-visible:ring-blue-500 text-center font-mono text-lg tracking-widest"
                      value={deleteTfaCode}
                      onChange={(e) =>
                        setDeleteTfaCode(e.target.value.replace(/\D/g, ""))
                      }
                      required
                    />
                  </div>
                )}

                <DialogFooter className="gap-2 sm:gap-2">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      className="group rounded-xl bg-slate-900 text-white transition-all duration-300 hover:bg-black"
                    >
                      <X className="mr-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" />
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="rounded-xl bg-zinc-100 text-black hover:bg-red-700 hover:text-white font-semibold px-6 border border-zinc-200 transition-all"
                    disabled={
                      profile?.isTfaEnabled && deleteTfaCode.length !== 6
                    }
                  >
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
