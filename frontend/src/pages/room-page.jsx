import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { Clock3, Paperclip, Send, Wifi, LogOut, Trash2, X } from "lucide-react";
import { Users } from "lucide-react";
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
import {
  appendRoomMessage,
  setRoomConnection,
  setRoomNotepad,
  removeExpiredMessages,
  setRoomMessages,
} from "@/features/chat/chat-slice";
import {
  createRoomSocket,
  disconnectSocket,
  sendNotepadUpdate,
  sendRoomMessage,
} from "@/services/chat-socket";
import { apiClient } from "@/services/api-client";
import { AppShell } from "@/components/layout/app-shell";
import { MessageBubble } from "@/components/room/message-bubble";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
  Tooltip,
} from "@/components/ui/tooltip";
import { API_BASE_URL } from "@/lib/config";
import { MembersCard } from "@/components/room/members-card.jsx";
const DISAPPEAR_DURATIONS = [
  { label: "30s", value: 30 },
  { label: "2m", value: 120 },
  { label: "5m", value: 300 },
];

export function RoomPage() {
  const { roomCode } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const token = useSelector((state) => state.auth.token);
  const currentUserEmail = useSelector((state) => state.auth.user?.email);
  const ownedRooms = useSelector((state) => state.rooms.owned);
  const messages = useSelector(
    (state) => state.chat.messagesByRoom[roomCode] || [],
  );
  const notepad = useSelector(
    (state) => state.chat.notepadByRoom[roomCode] || "",
  );
  const connection = useSelector(
    (state) => state.chat.connectionByRoom[roomCode] || "offline",
  );

  const [draft, setDraft] = useState("");
  const [isDisappearing, setIsDisappearing] = useState(false);
  const [disappearDuration, setDisappearDuration] = useState(120);
  const [burningIds, setBurningIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesBottomRef = useRef(null);
  const noteDebounceRef = useRef(null);

  const isOwner = useMemo(
    () => ownedRooms.some((r) => r.roomCode === roomCode),
    [ownedRooms, roomCode],
  );

  const [members, setMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!roomCode) return;
    apiClient
      .get(`/api/rooms/${roomCode}/members`)
      .then(({ data }) => setMembers(data))
      .catch((err) => console.error("Error fetching members", err));
  }, [roomCode]);

  useEffect(() => {
    messagesBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      messages.forEach((msg) => {
        if (msg.expiresAt && !burningIds.has(msg.id)) {
          const expireTime = new Date(msg.expiresAt).getTime();
          if (expireTime - now < 1500 && expireTime - now > 0) {
            setBurningIds((prev) => new Set([...prev, msg.id]));
          }
        }
      });
    }, 500);
    return () => clearInterval(timer);
  }, [messages, burningIds]);

  const visibleMessages = useMemo(
    () =>
      messages.filter(
        (m) => !m.expiresAt || new Date(m.expiresAt).getTime() > Date.now(),
      ),
    [messages],
  );

  useEffect(() => {
    const socket = createRoomSocket({
      token,
      roomCode,
      onConnect: () =>
        dispatch(setRoomConnection({ roomCode, status: "connected" })),
      onDisconnect: () =>
        dispatch(setRoomConnection({ roomCode, status: "offline" })),
      onMessage: (message) => {
        dispatch(appendRoomMessage({ roomCode, message }));
        setOnlineUsers((prev) => new Set([...prev, message.senderName]));
      },
      onNotepad: (content) => dispatch(setRoomNotepad({ roomCode, content })),
      onExpired: (payload) =>
        dispatch(
          removeExpiredMessages({
            roomCode,
            messageIds: payload?.messageIds || [],
          }),
        ),
    });
    socketRef.current = socket;
    return () => disconnectSocket(socket);
  }, [roomCode, token, dispatch]);

  useEffect(() => {
    if (!roomCode) return;
    let mounted = true;

    apiClient
      .get(`/api/rooms/${roomCode}/messages`)
      .then(({ data }) => {
        if (!mounted) return;
        dispatch(
          setRoomMessages({
            roomCode,
            messages: Array.isArray(data) ? data : [],
          }),
        );
      })
      .catch((error) => {
        console.error("Failed to fetch room messages:", error);
      });

    return () => {
      mounted = false;
    };
  }, [roomCode, dispatch]);

  const publishDraft = () => {
    if (!draft.trim()) return;
    sendRoomMessage(socketRef.current, roomCode, {
      content: draft.trim(),
      type: "CHAT",
      isDisappearing,
      duration: isDisappearing ? disappearDuration : null,
    });
    setDraft("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      publishDraft();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadUrl = new URL(
        "/api/attachments/upload",
        API_BASE_URL,
      ).toString();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();

      const uploadedFileUrl = data?.fileUrl || data?.filUrl || "";
      if (!uploadedFileUrl) {
        throw new Error("Upload succeeded but file URL is missing");
      }

      // Send via WebSocket
      sendRoomMessage(socketRef.current, roomCode, {
        content: "", // Image caption could go here if you added an input for it
        type: file.type.startsWith("image/") ? "IMAGE" : "FILE",
        fileUrl: uploadedFileUrl,
        fileName: data.fileName,
        contentType: data.contentType,
        isDisappearing,
        duration: isDisappearing ? disappearDuration : null,
      });

      e.target.value = ""; // Clear input
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleDeleteRoom = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomCode}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete room");

      // Navigate away after successful deletion
      navigate("/dashboard");
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateDivider = (dateString) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (dateString === today) return "Today";
    if (dateString === yesterday) return "Yesterday";
    return date.toLocaleDateString([], {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const actions = (
    <div className="flex items-center gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "h-8 w-10 flex items-center justify-center rounded-xl transition-all duration-500 cursor-help",
              connection === "connected"
                ? "bg-white border-transparent"
                : "bg-transparent border-white/20",
            )}
          >
            <Wifi
              className={cn(
                "h-4 w-4 transition-colors duration-300",
                connection === "connected" ? "text-black" : "text-white/40",
                connection === "connecting" && "animate-pulse",
              )}
            />
          </Badge>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-zinc-900 text-white border-zinc-800 rounded-lg"
        >
          <p className="text-[10px] font-medium capitalize">{connection}</p>
        </TooltipContent>
      </Tooltip>

      <Button
        variant="default"
        onClick={() => setShowMembers(!showMembers)}
        className={cn(
          "h-9 px-3 rounded-xl gap-2 transition-all duration-300 border-white group active:scale-95 hover:shadow-lg hover:shadow-black/5",
          showMembers
            ? "bg-transparent text-white hover:bg-white/10 hover:text-black"
            : "bg-transparent text-white hover:bg-white/10 hover:text-black",
        )}
      >
        <Users className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" />
        <span className="text-xs font-medium transition-transform duration-300 group-hover:translate-x-0.5">
          {showMembers ? "Hide" : "Members"}
        </span>
      </Button>

      {isOwner && (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="group relative flex items-center gap-2 overflow-hidden rounded-xl border-white text-red-500 bg-transparent px-4 py-2 transition-all hover:bg-red-500 hover:text-white hover:border-red-500"
            >
              <span className="relative z-10 font-medium">Delete Arc</span>
              <div className="relative h-4 w-4 overflow-hidden">
                <Trash2 className="absolute inset-0 h-4 w-4 transition-all duration-500 group-hover:translate-y-8 group-hover:opacity-0" />
                <Trash2 className="absolute inset-0 h-4 w-4 -translate-y-8 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" />
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-106.25 border-zinc-200 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Destroy Arc ?
              </DialogTitle>
              <DialogDescription className="text-black">
                This action is irreversible. All messages, files, and the shared
                notepad for
                <span className="font-mono font-bold text-red-700">
                  {" "}
                  {roomCode}{" "}
                </span>
                will be permanently purged from our servers.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <DialogClose>
                <Button
                  type="button"
                  variant="default"
                  className="group rounded-xl  text-white transition-all duration-300 hover:bg-black"
                >
                  <X className="mr-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-90" />
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteRoom}
                className="rounded-xl  bg-accent-foreground text-black hover:bg-red-700 hover:text-white font-semibold px-6"
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Button
        variant="default"
        className="group relative flex items-center gap-2 overflow-hidden rounded-xl border-black px-4 py-2 transition-all hover:bg-black hover:text-white"
        onClick={() => navigate("/dashboard")}
      >
        <span className="relative z-10 font-medium">Exit Room</span>
        <div className="relative h-4 w-4 overflow-hidden">
          <LogOut className="absolute inset-0 h-4 w-4 transition-all duration-500 group-hover:translate-x-8 group-hover:opacity-0" />
          <LogOut className="absolute inset-0 h-4 w-4 -translate-x-8 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" />
        </div>
      </Button>
    </div>
  );

  return (
    <TooltipProvider delayDuration={120}>
      <AppShell
        title="SCAPP. Arc Room"
        subtitle={`${roomCode}`}
        actions={actions}
      >
        <section
          className={cn(
            "grid gap-6 transition-all duration-500 ease-in-out h-[calc(100vh-180px)]",
            showMembers
              ? "lg:grid-cols-[300px_1fr_280px]"
              : "lg:grid-cols-[300px_1fr]",
          )}
        >
          <Card className="rounded-2xl border-gray-200 bg-white h-fit shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase font-bold text-zinc-400">
                Notepad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                readOnly={!isOwner}
                value={notepad}
                className={`
      min-h-100 resize-none focus-visible:ring-black border-none bg-zinc-50/50 rounded-xl
      ${!isOwner ? "cursor-not-allowed" : "cursor-text"}
    `}
                onChange={(e) => {
                  dispatch(
                    setRoomNotepad({ roomCode, content: e.target.value }),
                  );
                  if (isOwner) {
                    clearTimeout(noteDebounceRef.current);
                    noteDebounceRef.current = setTimeout(
                      () =>
                        sendNotepadUpdate(
                          socketRef.current,
                          roomCode,
                          e.target.value,
                        ),
                      300,
                    );
                  }
                }}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200 bg-white overflow-hidden shadow-sm">
            <CardContent className="flex flex-col h-[75vh] p-4">
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {visibleMessages.map((msg, index) => {
                  const isBurning = burningIds.has(msg.id);
                  const currentDate = new Date(msg.timestamp).toDateString();
                  const prevDate =
                    index > 0
                      ? new Date(
                          visibleMessages[index - 1].timestamp,
                        ).toDateString()
                      : null;
                  const showDivider = currentDate !== prevDate;

                  return (
                    <div key={msg.id}>
                      {showDivider && (
                        <div className="flex justify-center my-4 sticky top-0 z-10">
                          <span className="bg-black text-white text-[11px] font-medium px-3 py-1 rounded-xl uppercase tracking-wider border border-black shadow-sm">
                            {formatDateDivider(currentDate)}
                          </span>
                        </div>
                      )}
                      <div
                        className={cn(
                          "transition-all duration-1000 ease-in-out transform-gpu",
                          isBurning
                            ? "scale-90 opacity-0 blur-xl -translate-y-12 grayscale brightness-150"
                            : "scale-100 opacity-100",
                        )}
                      >
                        <MessageBubble
                          message={msg}
                          currentUserEmail={currentUserEmail}
                        />
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesBottomRef} />
              </div>

              <div className="relative flex flex-col gap-3 pt-4 border-t mt-2">
                {isDisappearing && (
                  <div className="absolute bottom-[calc(100%+12px)] left-0 flex animate-in fade-in slide-in-from-bottom-2 duration-300 gap-1 bg-zinc-900 p-1.5 rounded-2xl shadow-2xl z-20">
                    {DISAPPEAR_DURATIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={
                          disappearDuration === opt.value
                            ? "secondary"
                            : "ghost"
                        }
                        size="sm"
                        onClick={() => setDisappearDuration(opt.value)}
                        className={cn(
                          "h-8 rounded-xl px-4 text-xs font-bold transition-all",
                          disappearDuration === opt.value
                            ? "bg-white text-black"
                            : "text-white hover:text-black",
                        )}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl shrink-0 group active:scale-90 transition-transform"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4 transition-transform group-hover:rotate-12 group-hover:scale-110" />
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </Button>

                  <Button
                    variant={isDisappearing ? "default" : "outline"}
                    size="icon"
                    className={cn(
                      "rounded-xl shrink-0 group transition-all duration-300 ",
                      isDisappearing
                        ? "bg-violet-600 border-violet-600 hover:bg-violet-500"
                        : "hover:border-white",
                    )}
                    onClick={() => setIsDisappearing(!isDisappearing)}
                  >
                    <Clock3
                      className={cn(
                        "h-4 w-4 transition-transform duration-500 group-hover:rotate-360",
                        isDisappearing && "animate-pulse",
                      )}
                    />
                  </Button>

                  <Input
                    className="rounded-xl focus-visible:ring-black border-gray-200 hover:border-black"
                    placeholder="Type a Secured Message..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />

                  <Button
                    className="rounded-xl bg-black text-white px-6 hover:bg-gray-800 group relative overflow-hidden"
                    onClick={publishDraft}
                    disabled={!draft.trim()}
                  >
                    <div className="relative flex items-center justify-center">
                      <Send className="h-4 w-4 transition-all duration-500 group-hover:translate-x-12 group-hover:-translate-y-12 group-hover:opacity-0" />
                      <Send className="h-4 w-4 absolute -translate-x-12 translate-y-12 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {showMembers && (
            <>
              <aside className="hidden lg:flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                <MembersCard
                  members={members}
                  onlineUsers={onlineUsers}
                  currentUserEmail={currentUserEmail}
                  onClose={() => setShowMembers(false)}
                />
              </aside>

              <div className="lg:hidden fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="w-70 h-full shadow-2xl animate-in slide-in-from-right-full duration-500">
                  <MembersCard
                    members={members}
                    onlineUsers={onlineUsers}
                    currentUserEmail={currentUserEmail}
                    onClose={() => setShowMembers(false)}
                    isMobile
                  />
                </div>
              </div>
            </>
          )}
        </section>
      </AppShell>
    </TooltipProvider>
  );
}
