import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MembersCard({
                                members,
                                onlineUsers,
                                currentUserEmail,
                                onClose,
                                isMobile = false,
                            }) {

    // Generate initials (Teams style)
    const getInitials = (name) => {
        if (!name) return "?";
        const parts = name.trim().split(" ");
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    // Generate consistent avatar color
    const getAvatarColor = (email) => {
        const colors = [
            "bg-blue-500",
            "bg-indigo-500",
            "bg-purple-500",
            "bg-pink-500",
            "bg-green-500",
            "bg-orange-500",
            "bg-teal-500",
        ];

        let hash = 0;
        for (let i = 0; i < email.length; i++) {
            hash = email.charCodeAt(i) + ((hash << 5) - hash);
        }

        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="flex flex-col h-full border-l bg-white">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="text-sm font-semibold text-gray-700">
                    Participants
                </h2>

                {isMobile && (
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-gray-100"
                    >
                        <X className="w-4 h-4 text-gray-600" />
                    </button>
                )}
            </div>

            {/* Members */}
            <div className="flex-1 overflow-y-auto p-2">

                {members.map((member) => {
                    const isOnline = onlineUsers.has(member.email);
                    const isCurrentUser = member.email === currentUserEmail;

                    return (
                        <div
                            key={member.email}
                            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                        >

                            <div className="flex items-center gap-3">

                                {/* Avatar */}
                                <div className="relative">
                                    <div
                                        className={cn(
                                            "w-9 h-9 rounded-full text-white flex items-center justify-center text-sm font-semibold",
                                            getAvatarColor(member.email)
                                        )}
                                    >
                                        {getInitials(member.name)}
                                    </div>

                                    {/* Online dot */}
                                    <span
                                        className={cn(
                                            "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white",
                                            isOnline ? "bg-green-500" : "bg-gray-300"
                                        )}
                                    />
                                </div>

                                {/* Name */}
                                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-800">
                    {member.name}
                      {isCurrentUser && (
                          <span className="ml-1 text-xs text-gray-400">(You)</span>
                      )}
                  </span>

                                    <span className="text-xs text-gray-400">
                    {member.email}
                  </span>
                                </div>

                            </div>

                            {/* Status */}
                            <span
                                className={cn(
                                    "text-xs font-medium",
                                    isOnline ? "text-green-600" : "text-gray-400"
                                )}
                            >
                {isOnline ? "Online" : "Offline"}
              </span>

                        </div>
                    );
                })}

            </div>
        </div>
    );
}