import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Paperclip, Send, Smile, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatData, type ChatMessage } from "@/lib/chat-data";

const QUICK_EMOJI = ["😀", "😂", "😍", "🎉", "🔥", "👍", "🙏", "💯", "✨", "🚀", "❤️", "👀"];

export function MessageComposer({
  conversationId,
  replyTo,
  onCancelReply,
  editing,
  onCancelEdit,
}: {
  conversationId: string;
  replyTo?: ChatMessage | null;
  onCancelReply?: () => void;
  editing?: ChatMessage | null;
  onCancelEdit?: () => void;
}) {
  const { sendMessage, editMessage, getUser } = useChatData();
  const [value, setValue] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const replyAuthor = replyTo ? getUser(replyTo.authorId) : undefined;

  useEffect(() => {
    if (editing) {
      setValue(editing.content);
      taRef.current?.focus();
    }
  }, [editing]);

  useEffect(() => {
    setValue("");
    setImagePreview(null);
    taRef.current?.focus();
  }, [conversationId]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed && !imagePreview) return;
    if (editing) {
      editMessage(editing.id, trimmed);
      onCancelEdit?.();
    } else {
      sendMessage(conversationId, {
        content: trimmed,
        attachments: imagePreview ? [{ kind: "image", url: imagePreview }] : undefined,
        replyToId: replyTo?.id,
      });
      onCancelReply?.();
    }
    setValue("");
    setImagePreview(null);
    requestAnimationFrame(() => taRef.current?.focus());
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape") {
      onCancelReply?.();
      onCancelEdit?.();
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  return (
    <div className="border-t border-border bg-background/80 backdrop-blur">
      {(replyTo || editing) && (
        <div className="mx-auto flex max-w-3xl items-start gap-2 px-3 pt-2 sm:px-6">
          <div className="flex-1 rounded-lg border-l-2 border-primary bg-accent/50 px-3 py-1.5">
            <div className="text-[10px] font-medium uppercase tracking-wide text-primary">
              {editing ? "Editing" : `Replying to ${replyAuthor?.name ?? ""}`}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {(editing ?? replyTo)?.content || "Attachment"}
            </div>
          </div>
          <button
            onClick={editing ? onCancelEdit : onCancelReply}
            aria-label="Cancel"
            className="grid h-7 w-7 place-items-center rounded-md hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {imagePreview && (
        <div className="mx-auto max-w-3xl px-3 pt-2 sm:px-6">
          <div className="relative inline-block">
            <img src={imagePreview} alt="" className="h-24 rounded-lg border border-border object-cover" />
            <button
              onClick={() => setImagePreview(null)}
              aria-label="Remove image"
              className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-border bg-background shadow-soft"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="mx-auto flex max-w-3xl items-end gap-2 px-3 py-3 sm:px-6"
      >
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="Attach file"
            onClick={() => fileRef.current?.click()}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground ring-focus"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Add image"
            onClick={() => fileRef.current?.click()}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground ring-focus"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        </div>

        <div className="relative flex-1">
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Write a message…"
            aria-label="Message"
            className="block max-h-40 w-full resize-none rounded-2xl border border-border bg-surface px-4 py-2.5 pr-10 text-sm outline-none transition placeholder:text-muted-foreground focus:border-border-strong focus:ring-2 focus:ring-primary/20"
          />
          <div className="absolute bottom-1.5 right-1.5">
            <button
              type="button"
              aria-label="Emoji"
              onClick={() => setEmojiOpen((v) => !v)}
              className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <Smile className="h-4 w-4" />
            </button>
            {emojiOpen && (
              <div className="absolute bottom-10 right-0 z-10 grid grid-cols-6 gap-0.5 rounded-xl border border-border bg-popover p-1.5 shadow-elevated animate-in fade-in-0 zoom-in-95">
                {QUICK_EMOJI.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { setValue((v) => v + e); setEmojiOpen(false); taRef.current?.focus(); }}
                    className="grid h-8 w-8 place-items-center rounded-md text-lg transition hover:bg-accent"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          aria-label="Send"
          disabled={!value.trim() && !imagePreview}
          className={cn(
            "grid h-10 w-10 place-items-center rounded-full transition ring-focus",
            (value.trim() || imagePreview)
              ? "bg-primary text-primary-foreground shadow-glow hover:bg-primary-hover"
              : "bg-surface text-muted-foreground",
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
