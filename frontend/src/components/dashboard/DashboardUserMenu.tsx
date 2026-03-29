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



  const logout = () => {
    localStorage.removeItem("stock_compass_token");
    localStorage.removeItem("stock_compass_user");
    window.dispatchEvent(new Event("auth_change"));
    router.push("/");
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
            onSelect={() => router.push("/dashboard/settings")}
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
    </>
  );
}
