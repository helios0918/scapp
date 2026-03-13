import { Button } from "@/components/ui/button.jsx";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";
import { ShieldCheck, X } from "lucide-react";

export function MembersCard({ members, onlineUsers, currentUserEmail, onClose, isMobile }) {
    return (
        <div className={cn(
            "flex flex-col h-full bg-white transition-all",
            !isMobile && "border-l border-zinc-100"
        )}>
            <div className="flex items-center justify-between px-4 py-3 h-14.25 border-b border-zinc-50">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.05em] text-zinc-400">
                    Participants <span className="ml-1 text-[10px] opacity-60">({members.length})</span>
                </h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50"
                    onClick={onClose}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
                <div className="space-y-0.5">
                    {members.map((member) => {
                        const isOnline = onlineUsers.has(member.email) || member.email === currentUserEmail;

                        return (
                            <div
                                key={member.email}
                                className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-50/80 transition-all group"
                            >
                                <div className="relative shrink-0">
                                    <Avatar className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200/50 overflow-hidden">
                                        <AvatarFallback className="text-[10px] font-bold text-zinc-500 uppercase">
                                            {member.username?.substring(0, 2) || member.email.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={cn(
                                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                                        isOnline ? "bg-green-500" : "bg-zinc-300"
                                    )} />
                                </div>

                                <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn(
                                            "text-xs font-medium truncate",
                                            member.email === currentUserEmail ? "text-zinc-900" : "text-zinc-600"
                                        )}>
                                            {member.email === currentUserEmail ? "You" : (member.username || member.email.split('@')[0])}
                                        </span>
                                        {member.isOwner && (
                                            <ShieldCheck className="h-3 w-3 text-violet-500/70" />
                                        )}
                                    </div>
                                    <span className="text-[10px] text-zinc-400 leading-none">
                                        {member.isOwner ? "Arc Creater" : "Arc User"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="px-4 py-3 border-t border-zinc-50">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-black uppercase tracking-widest">Sync Active</span>
                </div>
            </div>
        </div>
    );
}