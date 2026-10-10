// Shared by the logged-in pages: auth guard, top bar, toasts, API helper.
const $ = (id) => document.getElementById(id);
const store = localStorage.getItem("token") ? localStorage : sessionStorage;
const token = store.getItem("token");
if (!token) location.replace("/index.html");
const currentUser = JSON.parse(store.getItem("user") || "{}");

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { logout(true); throw new Error("Sesi berakhir"); }
  if (!res.ok) { const e = new Error(data.message || "Terjadi kesalahan"); e.errors = data.errors; throw e; }
  return data;
}

function toast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.setAttribute("data-testid", `toast-${type}`);
  el.setAttribute("role", "status");
  el.textContent = message;
  $("toast-area").appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

async function logout(silent) {
  if (!silent) { try { await fetch("/api/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } }); } catch {} }
  localStorage.removeItem("token"); localStorage.removeItem("user");
  sessionStorage.removeItem("token"); sessionStorage.removeItem("user");
  location.replace("/index.html");
}

document.addEventListener("DOMContentLoaded", () => {
  $("user-name").textContent = currentUser.name || "-";
  $("user-role").textContent = currentUser.role || "";
  $("user-avatar").textContent = (currentUser.name || "?").charAt(0).toUpperCase();
  $("btn-logout").addEventListener("click", () => {
    if (confirm("Yakin ingin keluar?")) logout(false);
  });
});

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
