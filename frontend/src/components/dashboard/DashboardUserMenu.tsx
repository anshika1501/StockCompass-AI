"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

type UserShape = { id?: number; name: string; email?: string };

function readUserFromStorage(): UserShape | null {
  const raw = localStorage.getItem("stock_compass_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserShape;
  } catch {
    return null;
  }
}

function persistUser(u: UserShape) {
  localStorage.setItem("stock_compass_user", JSON.stringify(u));
  window.dispatchEvent(new Event("auth_change"));
}

export function DashboardUserMenu({ variant }: { variant: "desktop" | "mobile" }) {
  const router = useRouter();
  const [user, setUser] = useState<UserShape | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function sync() {
      setUser(readUserFromStorage());
    }
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("auth_change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("auth_change", sync);
    };
  }, []);

  useEffect(() => {
    if (settingsOpen && user) {
      setDraftName(user.name ?? "");
      setDraftEmail(user.email ?? "");
      setSaveError(null);
    }
  }, [settingsOpen, user]);

  const logout = () => {
    localStorage.removeItem("stock_compass_token");
    localStorage.removeItem("stock_compass_user");
    window.dispatchEvent(new Event("auth_change"));
    setSettingsOpen(false);
    router.push("/");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaveError(null);
    setSaving(true);
    try {
      const updated = await updateProfile({
        name: draftName.trim(),
        email: draftEmail.trim(),
      });
      const merged: UserShape = {
        ...user,
        ...updated,
        id: updated.id ?? user.id,
      };
      persistUser(merged);
      setUser(merged);
      setSettingsOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#4F8DF7] focus-visible:ring-offset-2",
              variant === "desktop" &&
                "flex min-w-0 max-w-[280px] items-center gap-3 p-1 hover:bg-slate-50",
              variant === "mobile" &&
                "flex max-w-[6.5rem] items-center gap-1 rounded-lg bg-slate-50 py-1 pl-1.5 pr-2 ring-1 ring-slate-200/90 sm:max-w-[9rem]"
            )}
            aria-label="Account menu"
          >
            {variant === "desktop" ? (
              <>
                <div className="min-w-0 flex-1 text-right">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                  {user.email ? (
                    <p className="truncate text-xs text-slate-500" title={user.email}>
                      {user.email}
                    </p>
                  ) : null}
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#4F8DF7] ring-1 ring-[#4F8DF7]/20">
                  <User className="h-5 w-5" aria-hidden />
                </div>
              </>
            ) : (
              <>
                <User className="h-3.5 w-3.5 shrink-0 text-[#4F8DF7]" aria-hidden />
                <span className="truncate text-xs font-semibold text-slate-800">{user.name}</span>
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[100] w-52 border-slate-200 bg-white shadow-lg">
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onSelect={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 text-slate-600" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer gap-2 text-red-600 focus:text-red-600" onSelect={logout}>
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="border-slate-200 bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Account settings</DialogTitle>
            <DialogDescription className="text-slate-600">
              Update your display name and email. Your email is also your sign-in username.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-name" className="text-slate-700">
                Display name
              </Label>
              <Input
                id="settings-name"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="border-slate-200"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-email" className="text-slate-700">
                Email
              </Label>
              <Input
                id="settings-email"
                type="email"
                value={draftEmail}
                onChange={(e) => setDraftEmail(e.target.value)}
                className="border-slate-200"
                autoComplete="email"
              />
            </div>
            {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}
            <DialogFooter className="gap-2 border-0 pt-0 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#4F8DF7] hover:bg-blue-600">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </DialogFooter>
          </form>
          <div className="border-t border-slate-100 pt-4">
            <Button type="button" variant="ghost" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out and go to home
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
