"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Lock, Smartphone, Send, User, ChevronRight, Share2, Shield, Eye, EyeOff, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserSettings, updateUserSettings, ProfileUser, updateProfile } from "@/lib/profile";
import { useToast } from "@/hooks/use-toast";

function readUserFromStorage(): ProfileUser | null {
  const raw = localStorage.getItem("stock_compass_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProfileUser;
  } catch {
    return null;
  }
}

function persistUser(u: ProfileUser) {
  localStorage.setItem("stock_compass_user", JSON.stringify(u));
  window.dispatchEvent(new Event("auth_change"));
}

export default function SettingsPage() {
  const { toast } = useToast();
  
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [hasMpin, setHasMpin] = useState(false);
  
  // Profile Drafts
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Drafts
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // MPIN Drafts
  const [oldMpin, setOldMpin] = useState("");
  const [newMpin, setNewMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [savingMpin, setSavingMpin] = useState(false);

  // Telegram Drafts
  const [telegramId, setTelegramId] = useState("");
  const [savingTelegram, setSavingTelegram] = useState(false);

  useEffect(() => {
    function load() {
      const u = readUserFromStorage();
      if (u) {
        setUser(u);
        setDraftName(u.name || "");
        setDraftEmail(u.email || "");
      }
    }
    load();
    window.addEventListener("auth_change", load);
    return () => window.removeEventListener("auth_change", load);
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getUserSettings();
        setHasMpin(settings.has_mpin);
        setTelegramId(settings.telegram_id || "");
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    }
    loadSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateProfile({
        name: draftName,
        email: draftEmail,
      });
      if (user) {
        const merged = { ...user, ...updated };
        persistUser(merged);
        setUser(merged);
      }
      toast({ title: "Profile updated successfully" });
    } catch (err: any) {
      toast({ title: "Failed to update profile", description: err.message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    try {
      await updateUserSettings({
        type: "password",
        old_password: oldPassword,
        new_password: newPassword,
      });
      toast({ title: "Password updated successfully" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Failed to update password", description: err.message, variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveMpin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMpin !== confirmMpin) {
      toast({ title: "MPINs do not match", variant: "destructive" });
      return;
    }
    if (newMpin.length !== 4 && newMpin.length !== 6) {
      toast({ title: "MPIN must be 4 or 6 digits", variant: "destructive" });
      return;
    }
    setSavingMpin(true);
    try {
      await updateUserSettings({
        type: "mpin",
        old_mpin: oldMpin,
        new_mpin: newMpin,
      });
      toast({ title: hasMpin ? "MPIN updated successfully" : "MPIN set successfully" });
      setHasMpin(true);
      setOldMpin("");
      setNewMpin("");
      setConfirmMpin("");
    } catch (err: any) {
      toast({ title: "Failed to update MPIN", description: err.message, variant: "destructive" });
    } finally {
      setSavingMpin(false);
    }
  };

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTelegram(true);
    try {
      const res = await updateUserSettings({
        type: "telegram",
        telegram_id: telegramId,
      });
      toast({ title: res.message || "Telegram ID updated successfully" });
    } catch (err: any) {
      toast({ title: "Failed to update Telegram ID", description: err.message, variant: "destructive" });
    } finally {
      setSavingTelegram(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Account Settings
        </h1>
        <p className="mt-2 text-slate-500">
          Manage your security preferences, notification channels, and personal information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Forms */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Profile Section */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-[#4F8DF7]">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Personal Information</h2>
                <p className="text-sm text-slate-500">Update your display name and email address</p>
                {user?.date_joined && (
                  <p className="text-xs text-slate-400 mt-1">
                    Account Created: {new Date(user.date_joined).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="p-6 bg-slate-50/50">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={draftEmail} onChange={(e) => setDraftEmail(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={savingProfile} className="bg-[#4F8DF7] hover:bg-blue-600 transition-colors">
                    {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Profile
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
               <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500">
                <Lock size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Password</h2>
                <p className="text-sm text-slate-500">Update your account password</p>
              </div>
            </div>
            <div className="p-6 bg-slate-50/50">
              <form onSubmit={handleSavePassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="old-password">Current Password</Label>
                  <div className="relative">
                    <Input 
                      id="old-password" 
                      type={showOldPassword ? "text" : "password"} 
                      value={oldPassword} 
                      onChange={(e) => setOldPassword(e.target.value)} 
                      required
                    />
                    <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input 
                        id="new-password" 
                        type={showNewPassword ? "text" : "password"} 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        required
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={savingPassword} className="bg-slate-800 hover:bg-slate-900 transition-colors">
                    {savingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* MPIN Section */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
               <div className="p-2 bg-purple-50 rounded-lg text-purple-500">
                <Smartphone size={20} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  Secure MPIN 
                  {hasMpin && <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>}
                </h2>
                <p className="text-sm text-slate-500">Quick authentication for sensitive actions</p>
              </div>
            </div>
            <div className="p-6 bg-slate-50/50">
              <form onSubmit={handleSaveMpin} className="space-y-5">
                {hasMpin && (
                  <div className="space-y-2 max-w-sm">
                    <Label htmlFor="old-mpin">Current MPIN</Label>
                    <Input id="old-mpin" type="password" maxLength={6} value={oldMpin} onChange={(e) => setOldMpin(e.target.value.replace(/\D/g, ''))} required placeholder="••••" className="tracking-widest" />
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-mpin">New MPIN</Label>
                    <Input id="new-mpin" type="password" maxLength={6} value={newMpin} onChange={(e) => setNewMpin(e.target.value.replace(/\D/g, ''))} required placeholder="4 to 6 digits" className="tracking-widest" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-mpin">Confirm New MPIN</Label>
                    <Input id="confirm-mpin" type="password" maxLength={6} value={confirmMpin} onChange={(e) => setConfirmMpin(e.target.value.replace(/\D/g, ''))} required placeholder="••••" className="tracking-widest" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={savingMpin} variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                    {savingMpin ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {hasMpin ? "Change MPIN" : "Set MPIN"}
                  </Button>
                </div>
              </form>
            </div>
          </div>

        </div>

        {/* Right Column - Integrations & Alerts */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Telegram Section */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-sky-50 rounded-lg text-sky-500">
                <Send size={20} />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Telegram Link</h2>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 mb-4">
                Link your Telegram account to receive instant trade alerts, portfolio summaries, and AI recommendations.
              </p>
              
              <form onSubmit={handleSaveTelegram} className="space-y-4">
                {/* Primary: Bot-guided linking */}
                <Link
                  href={`/connect-telegram?email=${encodeURIComponent(user?.email || '')}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 transition group"
                >
                  <div className="p-2 bg-sky-100 rounded-lg text-sky-500 group-hover:bg-sky-200 transition">
                    <MessageCircle size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-sky-700">Connect via Bot (Recommended)</p>
                    <p className="text-xs text-sky-500">Guided step-by-step linking with auto-detect</p>
                  </div>
                  <ChevronRight size={16} className="text-sky-400" />
                </Link>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="flex-1 h-px bg-slate-200" />
                  or enter Chat ID manually
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegram-id">Telegram Chat ID</Label>
                  <Input 
                    id="telegram-id" 
                    value={telegramId} 
                    onChange={(e) => setTelegramId(e.target.value)} 
                    placeholder="e.g. 123456789"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {telegramId ? '✅ Telegram is linked' : 'Not yet linked — use the button above for automatic setup.'}
                  </p>
                </div>
                <Button type="submit" disabled={savingTelegram} variant="outline" className="w-full border-sky-200 text-sky-700 hover:bg-sky-50">
                  {savingTelegram ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {telegramId ? "Update Chat ID" : "Save Chat ID"}
                </Button>
              </form>

              <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <Shield className="text-slate-400 shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 block mb-1">Privacy First</span>
                  Your Chat ID is encrypted and only used for requested platform notifications. We never send spam.
                </div>
              </div>
            </div>
          </div>

          {/* Quick Support Card */}
          <div className="rounded-2xl bg-gradient-to-br from-[#4F8DF7] to-indigo-600 p-6 text-white shadow-md">
            <h3 className="font-semibold text-lg mb-2">Need Help?</h3>
            <p className="text-blue-100 text-sm mb-4">
              If you have trouble accessing your account or setting up your MPIN, our support team is ready to assist you securely.
            </p>
            <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 text-white border-0" disabled>
              Contact Support Support
               <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
