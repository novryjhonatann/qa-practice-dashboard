const $ = (id) => document.getElementById(id);

if (sessionStorage.getItem("token") || localStorage.getItem("token")) location.replace("/dashboard.html");

$("btn-toggle-password").addEventListener("click", () => {
  const pw = $("password");
  const show = pw.type === "password";
  pw.type = show ? "text" : "password";
  $("btn-toggle-password").textContent = show ? "Sembunyi" : "Lihat";
});

function setFieldError(field, msg) {
  $(`${field}-error`).textContent = msg;
  $(field).closest(".field").classList.toggle("invalid", !!msg);
}

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = $("username").value.trim();
  const password = $("password").value;
  $("login-error").classList.add("hidden");
  setFieldError("username", username ? "" : "Username wajib diisi");
  setFieldError("password", password ? "" : "Password wajib diisi");
  if (!username || !password) return;

  const btn = $("btn-login");
  btn.disabled = true;
  btn.textContent = "Memproses...";
  try {
    const res = await fetch("/api/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    const store = $("remember-me").checked ? localStorage : sessionStorage;
    store.setItem("token", data.token);
    store.setItem("user", JSON.stringify(data.user));
    location.href = "/dashboard.html";
  } catch (err) {
    $("login-error").textContent = err.message || "Terjadi kesalahan, coba lagi";
    $("login-error").classList.remove("hidden");
  } finally {
    btn.disabled = false;
    btn.textContent = "Masuk";
  }
});
