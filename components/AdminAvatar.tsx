"use client";

import { useAuth } from "@/libs/authContext";
import { useEffect, useRef, useState } from "react";

export default function AdminAvatar() {
  const { isAdmin, isLoading, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const err = await login(username, password);
    if (err) {
      setError(err);
    } else {
      setOpen(false);
      setUsername("");
      setPassword("");
    }
    setSubmitting(false);
  };

  if (isLoading) return null;

  return (
    <div ref={containerRef}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={isAdmin ? "Admin" : "Đăng nhập"}
        className={`
    w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
    shadow border-2 transition-all
    ${
      isAdmin
        ? "bg-emerald-500 border-emerald-300 hover:bg-emerald-600"
        : "bg-white border-slate-200 hover:border-slate-300"
    }
  `}
      >
        <svg
          className={`w-4 h-4 ${isAdmin ? "text-white" : "text-slate-400"}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2a5 5 0 1 1 0 10A5 5 0 0 1 12 2zm0 12c5.33 0 8 2.67 8 4v2H4v-2c0-1.33 2.67-4 8-4z" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
    absolute right-0 top-10 sm:top-11
    w-[calc(100vw-24px)] sm:w-60
    max-w-xs
    bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden
  "
        >
          {isAdmin ? (
            /* ── Đã đăng nhập ── */
            <div className="py-1">
              <div className="px-4 py-2.5 flex items-center gap-2 border-b border-slate-100">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-semibold text-slate-700">
                  Admin
                </span>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            /* ── Chưa đăng nhập ── */
            <form onSubmit={handleLogin} className="p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Đăng nhập Admin
              </p>
              <input
                type="text"
                placeholder="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
              />
              {error && (
                <p className="text-xs text-rose-500 font-medium">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
              >
                {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
