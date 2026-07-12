import React, { useState } from "react";
import { inputCls, btnPrimary } from "../components/common/Shared";
import { useToast } from "../components/common/Toast";
import { apiFetch } from "../utils/api";

export function SettingsPage({ userProfile, setUserProfile, onLogout }: { userProfile: { name: string, email: string }, setUserProfile: any, onLogout: () => void }) {
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/auth/profile", { method: "PUT", body: JSON.stringify({ name }) });
      setUserProfile({ name, email });
      showToast("Profile updated successfully!", "success");
    } catch (e) {
      showToast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-neu shadow-neu-flat rounded-[2rem] p-6">
        <h2 className="text-xl font-bold text-foreground mb-6">User Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} disabled />
          </div>
          <button onClick={handleSave} disabled={saving} className={btnPrimary + " w-auto px-6 mt-2 disabled:opacity-50"}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
      <div className="bg-neu shadow-neu-flat rounded-[2rem] p-6 border border-red-500/20">
        <h2 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">Logging out will require you to sign back in to access your data.</p>
        <button onClick={onLogout} className="px-6 py-2.5 rounded-lg font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
          Logout
        </button>
      </div>
    </div>
  );
}
