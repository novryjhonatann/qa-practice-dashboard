// ---------- registration form ----------
function setErr(id, msg) { $(id).textContent = msg; return !msg; }

$("reg-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("r-name").value.trim();
  const email = $("r-email").value.trim();
  const phone = $("r-phone").value.trim();
  const dept = $("r-dept").value;
  const gender = document.querySelector("input[name=gender]:checked");
  const skills = [...document.querySelectorAll("input[name=skill]:checked")].map((c) => c.value);
  const cv = $("r-cv").files[0];

  const ok = [
    setErr("r-name-err", name.length < 3 ? "Nama minimal 3 karakter" : ""),
    setErr("r-email-err", !email ? "Email wajib diisi" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Format email tidak valid" : ""),
    setErr("r-phone-err", phone && !/^08\d{8,11}$/.test(phone) ? "No. HP harus diawali 08 dan 10-13 digit" : ""),
    setErr("r-dept-err", dept ? "" : "Divisi wajib dipilih"),
    setErr("r-gender-err", gender ? "" : "Jenis kelamin wajib dipilih"),
    setErr("r-agree-err", $("r-agree").checked ? "" : "Anda harus menyetujui syarat dan ketentuan"),
  ].every(Boolean);

  if (!ok) { $("r-result").classList.add("hidden"); return; }

  $("r-result").textContent = [
    "Pendaftaran berhasil!",
    `Nama     : ${name}`,
    `Email    : ${email}`,
    `No. HP   : ${phone || "-"}`,
    `Divisi   : ${dept}`,
    `Gender   : ${gender.value}`,
    `Keahlian : ${skills.join(", ") || "-"}`,
    `Bergabung: ${$("r-join").value || "-"}`,
    `CV       : ${cv ? cv.name : "-"}`,
  ].join("\n");
  $("r-result").classList.remove("hidden");
  toast("Pendaftaran berhasil disimpan");
});

$("reg-form").addEventListener("reset", () => {
  document.querySelectorAll("#reg-form .error-text").forEach((el) => (el.textContent = ""));
  $("r-result").classList.add("hidden");
});

// ---------- dialogs ----------
$("btn-alert").addEventListener("click", () => { alert("Ini adalah JS Alert"); $("dialog-result").textContent = "Hasil: Alert ditutup"; });
$("btn-confirm").addEventListener("click", () => {
  $("dialog-result").textContent = `Hasil: ${confirm("Apakah Anda yakin?") ? "OK diklik" : "Cancel diklik"}`;
});
$("btn-prompt").addEventListener("click", () => {
  const v = prompt("Masukkan nama Anda:");
  $("dialog-result").textContent = v === null ? "Hasil: Prompt dibatalkan" : `Hasil: Halo, ${v}`;
});

// ---------- dynamic ----------
$("btn-load-dynamic").addEventListener("click", () => {
  $("dynamic-area").innerHTML = `<div class="spinner" data-testid="dynamic-spinner"></div>`;
  setTimeout(() => {
    $("dynamic-area").innerHTML = `<div class="alert" style="background:#e7ecff;color:#2f49b5" id="dynamic-message" data-testid="dynamic-message">Data berhasil dimuat pada ${new Date().toLocaleTimeString("id-ID")}</div>`;
  }, 3000);
});
$("btn-toggle-hidden").addEventListener("click", () => $("hidden-box").classList.toggle("hidden"));
setTimeout(() => { $("btn-enable").disabled = false; $("btn-enable").textContent = "Sekarang sudah aktif"; }, 5000);
$("btn-enable").addEventListener("click", () => toast("Tombol berhasil diklik"));

// ---------- hover ----------
["menu-profile", "menu-settings"].forEach((id) => $(id).addEventListener("click", (e) => {
  e.preventDefault();
  $("hover-result").textContent = `Menu dipilih: ${e.target.textContent}`;
}));

// ---------- drag & drop ----------
$("drag-item").addEventListener("dragstart", (e) => e.dataTransfer.setData("text/plain", "drag-item"));
$("drop-zone").addEventListener("dragover", (e) => e.preventDefault());
$("drop-zone").addEventListener("drop", (e) => {
  e.preventDefault();
  $("drop-zone").textContent = "✅ Berhasil dijatuhkan!";
  $("drop-zone").style.borderColor = "#2b8a3e";
  $("drop-zone").style.color = "#2b8a3e";
});
