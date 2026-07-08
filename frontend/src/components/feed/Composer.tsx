import { useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Hash, Code2, X, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { uploadProfilePhoto } from "@/utils/cloudinary";

const suggestedTags = ["react", "typescript", "rust", "design", "postgres", "ml", "ios", "css", "oss"];

export function Composer({ onDone, onPostCreated }: { onDone?: () => void; onPostCreated?: (post: any) => void }) {
  const { user: authUser, token } = useAuth();
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [image, setImage] = useState<string | undefined>();
  const [file, setFile] = useState<File | undefined>();
  const [publishing, setPublishing] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const currentUser = {
    name: authUser?.fullName || "Developer",
    avatar: authUser?.avatarUrl || authUser?.profile?.avatar_url || ""
  };

  const max = 500;
  const remaining = max - content.length;
  const near = remaining <= 40;
  const over = remaining < 0;
  const canPost = content.trim().length > 0 && !over && !publishing;

  const addTag = (t: string) => {
    const clean = t.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!clean || tags.includes(clean) || tags.length >= 5) return;
    setTags([...tags, clean]);
    setTagInput("");
  };

  const onFile = (f?: File | null) => {
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setImage(url);
  };

  const submit = async () => {
    if (!canPost) return;
    setPublishing(true);
    try {
      let imageUrl = "";
      if (file) {
        imageUrl = await uploadProfilePhoto(file);
      }
      
      const response = await api.post<any>("/posts", { 
        content: content.trim(), 
        imageUrl 
      }, { token });

      if (response.success && response.post) {
        toast.success("Posted", { description: "Your post is live." });
        onPostCreated?.(response.post);
        setContent(""); 
        setTags([]); 
        setImage(undefined); 
        setFile(undefined);
        onDone?.();
      } else {
        throw new Error(response.message || "Failed to create post");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to post", { description: err.message || "Something went wrong." });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Create post</h3>
        </div>
      </div>

      <div className="flex gap-3 p-5">
        <Avatar className="h-10 w-10 shrink-0 border border-border">
          <AvatarImage src={currentUser.avatar} />
          <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <Textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What are you building?"
            className="min-h-[120px] resize-none border-0 bg-transparent p-0 text-[15px] leading-relaxed placeholder:text-muted-foreground focus-visible:ring-0"
          />

          {image && (
            <div
              onDragOver={(e) => e.preventDefault()}
              className="relative mt-3 overflow-hidden rounded-xl border border-border"
            >
              <img src={image} alt="upload" className="max-h-80 w-full object-cover" />
              <button
                onClick={() => { setImage(undefined); setFile(undefined); }}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur transition hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs text-primary"
                >
                  #{t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <div className="relative">
              <Hash className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
                }}
                placeholder="Add tag"
                className="h-7 w-28 rounded-md border border-border bg-surface pl-7 pr-2 text-xs outline-none placeholder:text-muted-foreground focus:border-border-strong"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {suggestedTags.filter((t) => !tags.includes(t)).slice(0, 4).map((t) => (
                <button
                  key={t}
                  onClick={() => addTag(t)}
                  className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs text-muted-foreground transition hover:border-border-strong hover:text-foreground"
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <div className="flex items-center gap-1">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <button
            onClick={() => fileRef.current?.click()}
            aria-label="Attach image"
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <button
            aria-label="Insert code"
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <Code2 className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={
              over ? "font-mono text-xs text-destructive"
              : near ? "font-mono text-xs text-warning"
              : "font-mono text-xs text-muted-foreground"
            }
          >
            {remaining}
          </span>
          <Button size="sm" onClick={submit} disabled={!canPost}>
            {publishing ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Publishing</> : "Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}
