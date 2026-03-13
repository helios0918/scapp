import { cn } from "@/lib/utils";
import { Clock3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { API_BASE_URL } from "@/lib/config";

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).toLowerCase();
}

function formatTooltipDateTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function renderAttachment(message) {
  if (!message?.fileUrl) return null;
  let fileUrl = message.fileUrl;
  try {
    fileUrl = new URL(message.fileUrl, API_BASE_URL).toString();
  } catch {
    fileUrl = message.fileUrl;
  }
  const contentType = message.contentType || "";
  const isImage = contentType.startsWith("image/") || message.type === "IMAGE";
  if (isImage) {
    return (
        <img
            src={fileUrl}
            alt={message.fileName || "Attachment"}
            loading="lazy"
            className="mt-1 mb-1 max-h-72 w-full rounded-lg object-cover"
        />
    );
  }
  return (
      <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 mb-2 block text-[12px] font-medium underline opacity-90"
      >
        {message.fileName || "View Attachment"}
      </a>
  );
}

export function MessageBubble({ message, currentUserEmail }) {
  const safeMessage = message ? { ...message } : {};
  const senderEmail = safeMessage.senderEmail || "";
  const senderName = safeMessage.senderName || "";
  const senderIdentity = (senderEmail || senderName).toLowerCase();
  const currentIdentity = (currentUserEmail || "").toLowerCase();
  const isOwn = Boolean(currentIdentity) && senderIdentity === currentIdentity;
  const isDisappearing = safeMessage.isDisappearing;

  const senderLabel = isOwn ? "You" : senderName || senderEmail || "Unknown user";
  const senderSecondary =
      senderEmail && senderEmail !== senderLabel ? senderEmail : null;

  return (
      <div className={cn("flex w-full px-4 py-0.5", isOwn ? "justify-end" : "justify-start")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
                className={cn(
                    "relative max-w-[85%] cursor-default px-2.5 py-1.5 shadow-sm transition-all duration-300",
                    isOwn
                        ? cn(
                            "rounded-l-xl rounded-br-sm rounded-tr-xl text-white",
                            isDisappearing ? "bg-violet-600" : "bg-blue-600"
                        )
                        : cn(
                            "rounded-r-xl rounded-bl-sm rounded-tl-xl text-white",
                            isDisappearing ? "bg-violet-600" : "bg-blue-600"
                        )
                )}
            >
              <div className="relative flex flex-col">
                {renderAttachment(safeMessage)}

                <div className="block whitespace-pre-wrap wrap-break-word text-[14.5px] leading-[1.4]">
                  {safeMessage.content}
                  <span className="inline-block w-17.5 h-1" />
                </div>

                <div
                    className={cn(
                        "absolute -bottom-0.5 -right-0.5 flex items-center gap-1 pl-4 pt-2 pb-0.5 pr-1",
                        isOwn ? "text-white/90 font-light" : "text-white/90 font-light"
                    )}
                    style={{
                      background: "linear-gradient(to top right, transparent 0%, transparent 40%, rgba(0,0,0,0.05) 100%)"
                    }}
                >
                  {isDisappearing && (
                      <Clock3 className={cn("h-2.75 w-2.75", isOwn ? "text-white" : "text-violet-600")} />
                  )}
                  <span className="text-[10px] font-medium whitespace-nowrap uppercase">
              {formatTime(safeMessage.timestamp)}
            </span>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side={isOwn ? "left" : "right"} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white">
            <div className="text-xs font-semibold">{senderLabel}</div>
            {senderSecondary && <div className="text-[11px] text-zinc-300">{senderSecondary}</div>}
            {!!safeMessage.timestamp && (
                <div className="mt-1 text-[10px] uppercase tracking-wide text-zinc-400">
                  {formatTooltipDateTime(safeMessage.timestamp)}
                </div>
            )}
          </TooltipContent>
        </Tooltip>
      </div>
  );
}
