import { BellOff, Pin, Search, Shield, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatData } from "@/lib/chat-data";

export function UserInfoPanel({ conversationId }: { conversationId: string }) {
  const { getConversation, getUser, getMessagesFor } = useChatData();
  const conv = getConversation(conversationId);
  const other = conv ? getUser(conv.participantIds[0]) : undefined;
  if (!other) return null;

  const messages = getMessagesFor(conversationId);
  const media = messages
    .flatMap((m) => m.attachments ?? [])
    .filter((a): a is { kind: "image"; url: string; name?: string } => a.kind === "image");
  const files = messages
    .flatMap((m) => m.attachments ?? [])
    .filter((a): a is { kind: "file"; url: string; name: string; size?: string } => a.kind === "file");

  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-sidebar">
      <div className="flex flex-col items-center gap-2 px-6 pb-6 pt-8">
        <Avatar className="h-20 w-20 border border-border">
          <AvatarImage src={other.avatar} alt="" />
          <AvatarFallback className="text-lg">{other.name[0]}</AvatarFallback>
        </Avatar>
        <div className="mt-2 text-center">
          <div className="text-base font-semibold">{other.name}</div>
          <div className="text-xs text-muted-foreground">@{other.username}</div>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {other.online && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          <span>{other.online ? "Online" : "Offline"}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4">
        <QuickAction icon={Search} label="Search" />
        <QuickAction icon={BellOff} label="Mute" />
        <QuickAction icon={Pin} label="Pin" />
      </div>

      <div className="mt-6 flex-1 space-y-6 overflow-y-auto px-6 pb-6">
        <Section title="Shared media" count={media.length}>
          {media.length === 0 ? (
            <p className="text-xs text-muted-foreground">No shared media yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {media.slice(0, 9).map((m, i) => (
                <img key={i} src={m.url} alt="" className="aspect-square w-full rounded-md border border-border object-cover" loading="lazy" />
              ))}
            </div>
          )}
        </Section>

        <Section title="Shared files" count={files.length}>
          {files.length === 0 ? (
            <p className="text-xs text-muted-foreground">No shared files yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-2 text-xs">
                  <div className="grid h-8 w-8 place-items-center rounded-md bg-accent">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{f.name}</div>
                    {f.size && <div className="text-[10px] text-muted-foreground">{f.size}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Privacy">
          <button className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs transition hover:border-border-strong">
            <Shield className="h-3.5 w-3.5" /> Block user
          </button>
          <button className="mt-1.5 flex w-full items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive transition hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" /> Delete conversation
          </button>
        </Section>
      </div>
    </aside>
  );
}

function QuickAction({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface py-3 text-[10px] font-medium text-muted-foreground transition hover:border-border-strong hover:text-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
        {typeof count === "number" && count > 0 && (
          <span className="font-mono text-[10px] text-muted-foreground">{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}
