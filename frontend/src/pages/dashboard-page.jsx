import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Settings,
  X,
  ArrowRight,
  Loader2,
  Plus,
  AlertCircle,
} from "lucide-react";
import { logout } from "@/features/auth/auth-slice";
import { fetchProfile } from "@/features/profile/profile-slice";
import { createRoom, fetchRooms, joinRoom } from "@/features/rooms/rooms-slice";
import { AppShell } from "@/components/layout/app-shell";
import { RoomCard } from "@/components/room/room-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Selectors
  const roomsStatus = useSelector((state) => state.rooms.status);
  const roomsError = useSelector((state) => state.rooms.error);
  const profile = useSelector((state) => state.profile.profile);
  const owned = useSelector((state) => state.rooms.owned);
  const joined = useSelector((state) => state.rooms.joined);

  // Local State
  const [createPassword, setCreatePassword] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    dispatch(fetchRooms());
    dispatch(fetchProfile());
  }, [dispatch]);

  // Reset form when modals close
  useEffect(() => {
    if (!joinOpen && !createOpen) {
      setLocalError("");
      setFormSubmitted(false);
      setJoinCode("");
      setJoinPassword("");
      setCreatePassword("");
      setCreateDescription("");
    }
  }, [joinOpen, createOpen]);

  // Opens Join Dialog with pre-filled room code
  const openJoinPrompt = (code) => {
    setJoinCode(code);
    setJoinOpen(true);
    setLocalError("");
  };

  async function handleCreateRoom() {
    if (!createPassword.trim()) {
      setLocalError("Room password is required.");
      setFormSubmitted(true);
      return;
    }
    setLocalError("");
    setBusyAction("create");
    try {
      const descriptionToUse =
        createDescription.trim() || "Private collaboration arc";
      const response = await dispatch(
        createRoom({
          password: createPassword.trim(),
          description: descriptionToUse,
        }),
      ).unwrap();
      setCreateOpen(false);
      navigate(`/room/${response.roomCode}`);
    } catch (err) {
      setLocalError("Could not create arc. Please try again.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleJoinRoom() {
    setFormSubmitted(true);
    const normalizedCode = joinCode.trim().toUpperCase();

    if (!normalizedCode || !joinPassword.trim()) {
      setLocalError("Please fill in all fields to join the arc.");
      return;
    }

    setLocalError("");
    setBusyAction("join");

    try {
      await dispatch(
        joinRoom({ roomCode: normalizedCode, password: joinPassword.trim() }),
      ).unwrap();

      setJoinOpen(false);
      navigate(`/room/${normalizedCode}`);
    } catch (err) {
      setLocalError(err || "Access denied. Check your credentials.");
    } finally {
      setBusyAction("");
    }
  }

  const actions = (
    <>
      <Button
        variant="default"
        className="group rounded-xl border-white/20 bg-white/5 backdrop-blur-md transition-all duration-300 hover:bg-black hover:border-black"
        onClick={() => navigate("/profile")}
      >
        <Settings className="h-4 w-4 mr-2 transition-transform duration-500 group-hover:rotate-90" />
        Settings
      </Button>
      <Button
        className="group flex items-center gap-2 rounded-xl hover:bg-red-700 hover:text-white"
        variant="default"
        onClick={() => {
          dispatch(logout());
          navigate("/login", { replace: true });
        }}
      >
        <LogOut className="h-4 w-4 transform transition-transform duration-200 group-hover:translate-x-1" />
        Logout
      </Button>
    </>
  );

  return (
    <AppShell
      title="SCAPP."
      subtitle={`${profile?.username ? `User " ${profile.username} "` : ""}`}
      actions={actions}
    >
      {roomsError && !joinOpen && !createOpen && (
        <Card className="mb-6 border-red-200 bg-red-50 text-foreground">
          <CardContent className="p-4 text-sm text-red-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {roomsError}
          </CardContent>
        </Card>
      )}

      <section className="space-y-6">
        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Your Arcs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {roomsStatus === "loading" && (
              <p className="text-sm text-muted-foreground animate-pulse">
                Loading arcs...
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {owned.map((room) => (
                <RoomCard
                  key={`owned-${room.roomCode}`}
                  room={room}
                  mode="owned"
                  onOpen={(selectedCode) => navigate(`/room/${selectedCode}`)}
                />
              ))}
              <RoomCard mode="create" onCreate={() => setCreateOpen(true)} />
            </div>

            <Separator />

            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Joined Arcs</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {joined.map((room) => (
                  <RoomCard
                    key={`joined-${room.roomCode}`}
                    room={room}
                    mode="joined"
                    // Force password entry for previously joined arcs
                    onOpen={(selectedCode) => openJoinPrompt(selectedCode)}
                  />
                ))}
                <RoomCard mode="join" onJoin={() => setJoinOpen(true)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* JOIN DIALOG */}
      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join an Arc</DialogTitle>
            {localError && (
              <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 p-2 rounded-lg mt-2">
                <AlertCircle className="h-3 w-3" />
                {localError}
              </div>
            )}
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="join-room-code">Arc code</Label>
              <Input
                className={cn(
                  "hover:border-black transition-colors",
                  formSubmitted &&
                    !joinCode.trim() &&
                    "border-red-500 focus-visible:ring-red-500",
                )}
                id="join-room-code"
                placeholder="xxxxxxxx"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value);
                  if (localError) setLocalError("");
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="join-room-pass">Arc password</Label>
              <Input
                className={cn(
                  "hover:border-black transition-colors",
                  formSubmitted &&
                    !joinPassword.trim() &&
                    "border-red-500 focus-visible:ring-red-500",
                )}
                id="join-room-pass"
                type="password"
                placeholder="**********"
                value={joinPassword}
                onChange={(e) => {
                  setJoinPassword(e.target.value);
                  if (localError) setLocalError("");
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                className="group rounded-xl bg-red-600 text-white transition-all duration-300 hover:bg-red-700"
                type="button"
                variant="default"
              >
                <X className="mr-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" />
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="default"
              onClick={handleJoinRoom}
              disabled={busyAction === "join"}
              className="group relative rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all duration-500 hover:bg-black hover:border-white/40 min-w-32.5"
            >
              {busyAction === "join" ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              )}
              {busyAction === "join" ? "Joining..." : "Join Arc"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE DIALOG */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Arc</DialogTitle>
            <DialogDescription>Set Your Arc Password</DialogDescription>
            {localError && (
              <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 p-2 rounded-lg mt-2">
                <AlertCircle className="h-3 w-3" />
                {localError}
              </div>
            )}
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="create-room-pass">Arc password</Label>
              <Input
                className={cn(
                  "hover:border-black transition-colors",
                  formSubmitted && !createPassword.trim() && "border-red-500",
                )}
                id="create-room-pass"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-room-desc">
                Arc description (Optional)
              </Label>
              <Textarea
                className="hover:border-black"
                id="create-room-desc"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                className="group rounded-xl bg-red-600 text-white transition-all duration-300 hover:bg-red-700"
                type="button"
                variant="default"
              >
                <X className="mr-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" />
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="default"
              onClick={handleCreateRoom}
              disabled={busyAction === "create"}
              className="group relative rounded-xl border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all duration-500 hover:bg-black hover:border-white/40 min-w-32.5"
            >
              {busyAction === "create" ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="mr-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-125" />
              )}
              {busyAction === "create" ? "Creating..." : "Create Arc"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
