const PAGE_SIZE = 5;
const PRIORITY_RANK = { Low: 1, Medium: 2, High: 3, Critical: 4 };
let rows = [];
let page = 1;
let sort = { key: "code", dir: 1 };
let editingId = null;
let deletingId = null;
let searchTimer = null;

async function loadStats() {
  const s = await api("/api/stats");
  $("stat-total").textContent = s.total;
  $("stat-planning").textContent = s.planning;
  $("stat-progress").textContent = s.inProgress;
  $("stat-testing").textContent = s.testing;
  $("stat-done").textContent = s.done;
}

async function loadProjects() {
  $("loading").classList.remove("hidden");
  const params = new URLSearchParams({ search: $("search").value.trim(), status: $("filter-status").value });
  try {
    const res = await api(`/api/projects?${params}`);
    rows = res.data;
    page = 1;
    render();
  } catch (e) {
    toast(e.message, "error");
  } finally {
    $("loading").classList.add("hidden");
  }
}

function sorted() {
  const { key, dir } = sort;
  return [...rows].sort((a, b) => {
    const va = key === "priority" ? PRIORITY_RANK[a[key]] : a[key];
    const vb = key === "priority" ? PRIORITY_RANK[b[key]] : b[key];
    return (va > vb ? 1 : va < vb ? -1 : 0) * dir;
  });
}

function render() {
  const list = sorted();
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  page = Math.min(page, pages);
  const slice = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  $("project-rows").innerHTML = slice.length ? slice.map((p) => `
    <tr data-testid="project-row" data-id="${p.id}">
      <td data-testid="cell-code">${escapeHtml(p.code)}</td>
      <td data-testid="cell-name">${escapeHtml(p.name)}</td>
      <td data-testid="cell-owner">${escapeHtml(p.owner)}</td>
      <td data-testid="cell-status"><span class="badge b-${p.status.replace(" ", "")}">${p.status}</span></td>
      <td data-testid="cell-priority" class="p-${p.priority}">${p.priority}</td>
      <td data-testid="cell-progress"><span class="progress"><span style="width:${p.progress}%"></span></span>${p.progress}%</td>
      <td data-testid="cell-due-date">${formatDate(p.dueDate)}</td>
      <td><div class="actions">
        <button class="btn btn-sm" data-action="edit" data-id="${p.id}" data-testid="btn-edit-${p.code}">Edit</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${p.id}" data-testid="btn-delete-${p.code}">Hapus</button>
      </div></td>
    </tr>`).join("")
    : `<tr><td colspan="8" class="empty" data-testid="empty-state">Tidak ada data proyek yang cocok</td></tr>`;

  const start = list.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  $("table-info").textContent = `Menampilkan ${start}-${Math.min(page * PAGE_SIZE, list.length)} dari ${list.length} proyek`;
  $("page-info").textContent = `Halaman ${page} / ${pages}`;
  $("btn-prev").disabled = page <= 1;
  $("btn-next").disabled = page >= pages;
  document.querySelectorAll("th[data-sort] .arrow").forEach((el) => {
    el.textContent = el.parentElement.dataset.sort === sort.key ? (sort.dir === 1 ? "▲" : "▼") : "";
  });
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ---------- modal ----------
const FIELDS = { code: "f-code", name: "f-name", owner: "f-owner", status: "f-status", priority: "f-priority", progress: "f-progress", dueDate: "f-due" };

function clearErrors() {
  Object.keys(FIELDS).forEach((k) => {
    $(`err-${k}`).textContent = "";
    $(FIELDS[k]).closest(".field").classList.remove("invalid");
  });
}

function openModal(project) {
  editingId = project ? project.id : null;
  $("modal-title").textContent = project ? `Edit Proyek ${project.code}` : "Tambah Proyek";
  clearErrors();
  const p = project || { code: "", name: "", owner: "", status: "Planning", priority: "Medium", progress: 0, dueDate: "" };
  Object.entries(FIELDS).forEach(([k, id]) => ($(id).value = p[k]));
  $("project-modal").classList.remove("hidden");
  $("f-code").focus();
}

const closeModal = () => $("project-modal").classList.add("hidden");

$("project-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();
  const body = Object.fromEntries(Object.entries(FIELDS).map(([k, id]) => [k, $(id).value]));
  body.progress = body.progress === "" ? "" : Number(body.progress);
  $("btn-save").disabled = true;
  try {
    if (editingId) {
      await api(`/api/projects/${editingId}`, { method: "PUT", body: JSON.stringify(body) });
      toast(`Proyek ${body.code} berhasil diperbarui`);
    } else {
      await api("/api/projects", { method: "POST", body: JSON.stringify(body) });
      toast(`Proyek ${body.code} berhasil ditambahkan`);
    }
    closeModal();
    await Promise.all([loadProjects(), loadStats()]);
  } catch (err) {
    if (err.errors) {
      Object.entries(err.errors).forEach(([k, msg]) => {
        $(`err-${k}`).textContent = msg;
        $(FIELDS[k]).closest(".field").classList.add("invalid");
      });
    } else toast(err.message, "error");
  } finally {
    $("btn-save").disabled = false;
  }
});

// ---------- events ----------
$("btn-add").addEventListener("click", () => openModal(null));
$("btn-close-modal").addEventListener("click", closeModal);
$("btn-cancel").addEventListener("click", closeModal);
$("search").addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadProjects, 400); });
$("filter-status").addEventListener("change", loadProjects);
$("btn-prev").addEventListener("click", () => { page--; render(); });
$("btn-next").addEventListener("click", () => { page++; render(); });

document.querySelectorAll("th[data-sort]").forEach((th) => th.addEventListener("click", () => {
  const key = th.dataset.sort;
  sort = { key, dir: sort.key === key ? -sort.dir : 1 };
  render();
}));

$("project-rows").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const p = rows.find((r) => r.id === Number(btn.dataset.id));
  if (btn.dataset.action === "edit") openModal(p);
  else {
    deletingId = p.id;
    $("delete-text").textContent = `Yakin ingin menghapus proyek ${p.code} - ${p.name}? Tindakan ini tidak dapat dibatalkan.`;
    $("delete-modal").classList.remove("hidden");
  }
});

$("btn-delete-cancel").addEventListener("click", () => $("delete-modal").classList.add("hidden"));
$("btn-delete-confirm").addEventListener("click", async () => {
  try {
    const res = await api(`/api/projects/${deletingId}`, { method: "DELETE" });
    toast(res.message);
    $("delete-modal").classList.add("hidden");
    await Promise.all([loadProjects(), loadStats()]);
  } catch (e) { toast(e.message, "error"); }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeModal(); $("delete-modal").classList.add("hidden"); }
});

loadStats();
loadProjects();
