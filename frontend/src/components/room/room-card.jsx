import { Plus, UserRoundPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CometCard } from "@/components/ui/comet-card";

export function RoomCard({ room, mode = "owned", onOpen, onCreate, onJoin }) {
    if (mode === "create") {
        return (
            <CometCard className="w-75 h-50" onClick={onCreate}>
                <Card className="h-full w-full cursor-pointer rounded-2xl border border-gray-200 bg-white shadow-sm flex items-center justify-center transition-colors hover:border-black">
                    <div className="flex flex-col items-center gap-3 text-gray-600">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                            <Plus className="h-5 w-5" />
                        </div>
                        <span className="text-base font-medium">Create Arc</span>
                    </div>
                </Card>
            </CometCard>
        );
    }

    if (mode === "join") {
        return (
            <CometCard className="w-75 h-50" onClick={onJoin}>
                <Card className="h-full w-full cursor-pointer rounded-2xl border border-gray-200 bg-white shadow-sm flex items-center justify-center transition-colors hover:border-black">
                    <div className="flex flex-col items-center gap-3 text-gray-600">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                            <UserRoundPlus className="h-5 w-5" />
                        </div>
                        <span className="text-base font-medium">Join Arc</span>
                    </div>
                </Card>
            </CometCard>
        );
    }

    return (
        <CometCard className="w-75 h-50" onClick={() => onOpen(room.roomCode)}>
            <Card className="h-full w-full cursor-pointer rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors hover:border-black">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <Badge
                            variant={mode === "owned" ? "default" : "secondary"}
                            className="text-xs"
                        >
                            {mode === "owned" ? "Owner" : "Joined"}
                        </Badge>
                        <span className="text-xs font-mono text-gray-400">
              {room.roomCode}
            </span>
                    </div>
                    <CardTitle className="text-base font-semibold text-gray-900 line-clamp-3">
                        {room.description?.trim() || "Private collaboration arc"}
                    </CardTitle>
                </CardHeader>

                <CardContent className="pt-0 text-sm text-gray-500">
                    {mode === "joined" && room.createdBy ? `by ${room.createdBy}` : null}
                </CardContent>
            </Card>
        </CometCard>
    );
}