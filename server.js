// QA Practice Dashboard: a small app under test for Katalon (Web UI + API).
// No dependencies: run with `node server.js`, then open http://localhost:3000
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "public");

const USERS = [
  { username: "admin", password: "admin123", name: "Admin QA", role: "Administrator" },
  { username: "tester", password: "tester123", name: "Novry", role: "QA Engineer" },
  { username: "locked", password: "locked123", name: "Locked User", role: "QA Engineer", locked: true },
];
const STATUSES = ["Planning", "In Progress", "Testing", "Done"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

function seed() {
  const rows = [
    ["Implementasi ERP Fase 2", "Budi Santoso", "In Progress", "High", 45, "2026-12-15"],
    ["Aplikasi Mobile Absensi", "Siti Rahma", "Testing", "Medium", 80, "2026-11-01"],
    ["Migrasi Database Oracle", "Andi Wijaya", "Planning", "Critical", 5, "2027-02-28"],
    ["Portal Pelanggan v3", "Novry", "In Progress", "High", 60, "2026-12-01"],
    ["Integrasi Payment Gateway", "Dewi Lestari", "Done", "Critical", 100, "2026-09-30"],
    ["Dashboard Analitik Sales", "Rudi Hartono", "Testing", "Medium", 90, "2026-10-25"],
    ["Sistem Tiket Helpdesk", "Maya Putri", "Done", "Low", 100, "2026-08-15"],
    ["Upgrade Server Produksi", "Andi Wijaya", "Planning", "High", 0, "2027-01-20"],
    ["E-Learning Karyawan", "Siti Rahma", "In Progress", "Low", 30, "2027-03-10"],
    ["Aplikasi Inventaris Gudang", "Budi Santoso", "Testing", "High", 75, "2026-11-20"],
    ["Chatbot Layanan Nasabah", "Dewi Lestari", "In Progress", "Medium", 50, "2027-01-05"],
    ["Audit Keamanan Aplikasi", "Novry", "Planning", "Critical", 10, "2026-12-30"],
  ];
  return rows.map(([name, owner, status, priority, progress, dueDate], i) => ({
    id: i + 1, code: `PRJ-${String(i + 1).padStart(3, "0")}`, name, owner, status, priority, progress, dueDate,
  }));
}

let projects = seed();
let nextId = projects.length + 1;
const tokens = new Map(); // token -> username

// ---------- helpers ----------
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".png": "image/png" };

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { resolve(null); }
    });
  });
}

function authUser(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || "");
  const username = m && tokens.get(m[1]);
  return username ? USERS.find((u) => u.username === username) : null;
}

const delay = (min, max) => new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));

function validate(p, currentId) {
  const errors = {};
  if (!p.name || p.name.trim().length < 3) errors.name = "Nama proyek minimal 3 karakter";
  else if (p.name.length > 100) errors.name = "Nama proyek maksimal 100 karakter";
  if (!/^PRJ-\d{3}$/.test(p.code || "")) errors.code = "Format kode harus PRJ-XXX (contoh: PRJ-013)";
  else if (projects.some((x) => x.code === p.code && x.id !== currentId)) errors.code = "Kode proyek sudah digunakan";
  if (!p.owner || !p.owner.trim()) errors.owner = "Penanggung jawab wajib diisi";
  if (!STATUSES.includes(p.status)) errors.status = "Status tidak valid";
  if (!PRIORITIES.includes(p.priority)) errors.priority = "Prioritas tidak valid";
  const prog = Number(p.progress);
  if (!Number.isInteger(prog) || prog < 0 || prog > 100) errors.progress = "Progres harus angka 0 - 100";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.dueDate || "")) errors.dueDate = "Tanggal tenggat wajib diisi";
  return errors;
}

function clean(p) {
  return { code: p.code, name: p.name.trim(), owner: p.owner.trim(), status: p.status, priority: p.priority, progress: Number(p.progress), dueDate: p.dueDate };
}

// ---------- API ----------
async function api(req, res, url) {
  const method = req.method;
  const parts = url.pathname.split("/").filter(Boolean); // ["api", ...]

  if (method === "POST" && url.pathname === "/api/login") {
    const body = await readBody(req);
    if (!body || !body.username || !body.password) return send(res, 400, { message: "Username dan password wajib diisi" });
    const u = USERS.find((x) => x.username === body.username && x.password === body.password);
    if (!u) return send(res, 401, { message: "Username atau password salah" });
    if (u.locked) return send(res, 423, { message: "Akun Anda terkunci. Hubungi administrator." });
    const token = crypto.randomBytes(16).toString("hex");
    tokens.set(token, u.username);
    return send(res, 200, { token, user: { username: u.username, name: u.name, role: u.role } });
  }

  if (method === "POST" && url.pathname === "/api/reset") {
    projects = seed();
    nextId = projects.length + 1;
    return send(res, 200, { message: "Data berhasil di-reset", total: projects.length });
  }

  if (method === "GET" && url.pathname === "/api/health") return send(res, 200, { status: "ok" });

  const user = authUser(req);
  if (!user) return send(res, 401, { message: "Unauthorized: token tidak valid atau tidak ada" });

  if (method === "POST" && url.pathname === "/api/logout") {
    tokens.delete(req.headers.authorization.slice(7));
    return send(res, 200, { message: "Berhasil logout" });
  }

  if (method === "GET" && url.pathname === "/api/me") return send(res, 200, { username: user.username, name: user.name, role: user.role });

  if (method === "GET" && url.pathname === "/api/stats") {
    const by = (s) => projects.filter((p) => p.status === s).length;
    return send(res, 200, {
      total: projects.length, planning: by("Planning"), inProgress: by("In Progress"), testing: by("Testing"), done: by("Done"),
      avgProgress: projects.length ? Math.round(projects.reduce((a, p) => a + p.progress, 0) / projects.length) : 0,
    });
  }

  if (parts[1] === "projects") {
    const id = parts[2] ? Number(parts[2]) : null;
    const found = id ? projects.find((p) => p.id === id) : null;
    if (id && !found) return send(res, 404, { message: `Proyek dengan id ${id} tidak ditemukan` });

    if (method === "GET" && !id) {
      await delay(300, 1200); // deliberate latency so UI tests must wait properly
      const q = (url.searchParams.get("search") || "").toLowerCase();
      const status = url.searchParams.get("status") || "";
      const data = projects.filter((p) =>
        (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q)) &&
        (!status || p.status === status));
      return send(res, 200, { total: data.length, data });
    }
    if (method === "GET") return send(res, 200, found);

    if (method === "POST" && !id) {
      const body = await readBody(req);
      if (!body) return send(res, 400, { message: "Body harus JSON yang valid" });
      const errors = validate(body, null);
      if (Object.keys(errors).length) return send(res, 400, { message: "Validasi gagal", errors });
      const p = { id: nextId++, ...clean(body) };
      projects.push(p);
      return send(res, 201, p);
    }
    if (method === "PUT" && id) {
      const body = await readBody(req);
      if (!body) return send(res, 400, { message: "Body harus JSON yang valid" });
      const merged = { ...found, ...body };
      const errors = validate(merged, id);
      if (Object.keys(errors).length) return send(res, 400, { message: "Validasi gagal", errors });
      Object.assign(found, clean(merged));
      return send(res, 200, found);
    }
    if (method === "DELETE" && id) {
      projects = projects.filter((p) => p.id !== id);
      return send(res, 200, { message: `Proyek ${found.code} berhasil dihapus` });
    }
  }

  send(res, 404, { message: "Endpoint tidak ditemukan" });
}

// ---------- server ----------
http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) return api(req, res, url);

  let file = url.pathname === "/" ? "/index.html" : url.pathname;
  const full = path.join(PUBLIC, path.normalize(file));
  if (!full.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(full, (err, buf) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("404 Not Found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(full)] || "application/octet-stream" });
    res.end(buf);
  });
}).listen(PORT, () => console.log(`QA Practice Dashboard berjalan di http://localhost:${PORT}`));
