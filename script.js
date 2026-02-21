const profileStorageKey = "bkd_profile_v1";
const trackerStorageKey = "bkd_weekly_tracker_v1";
const mealPlanStorageKey = "bkd_meal_plan_v1";
const favoritesStorageKey = "bkd_favorites_v1";
const sessionPlanStorageKey = "bkd_session_plan_v1";
const authUsersStorageKey = "bkd_auth_users_v1";
const authSessionStorageKey = "bkd_auth_session_v1";
const customProgramsStorageKey = "bkd_custom_programs_v1";
const weeklyMetricsStorageKey = "bkd_weekly_metrics_v1";

function byId(id) {
  return document.getElementById(id);
}

function safeParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const toastEl = byId("toast");
let toastTimer = null;

function showToast(message) {
  if (!toastEl) {
    return;
  }

  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2400);
}

const filterButtons = document.querySelectorAll(".filter-btn");
const workoutPanels = document.querySelectorAll(".workout-panel");

if (filterButtons.length && workoutPanels.length) {
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const muscle = button.dataset.muscle;

      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      workoutPanels.forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.muscle === muscle);
      });
    });
  });
}

const recommendationText = byId("recommendation");
const goalSelect = byId("goalSelect");
const recommendButton = byId("recommendBtn");
const programGrid = byId("programGrid");

function getProgramCards() {
  if (programGrid) {
    return [...programGrid.querySelectorAll(".program-card")];
  }
  return [...document.querySelectorAll(".program-card")];
}

if (programGrid) {
  programGrid.addEventListener("click", (event) => {
    const toggleButton = event.target.closest(".toggle-detail");
    if (!toggleButton) {
      return;
    }

    const card = toggleButton.closest(".program-card");
    if (!card) {
      return;
    }

    const isOpen = card.classList.toggle("open");
    toggleButton.textContent = isOpen ? "Detayi Kapat" : "Detayi Gor";
  });
}

const recommendations = {
  kas: {
    key: "titan",
    text: "Oneri: Titan 4 Gun. Haftalik hacim artisi icin en dengeli kas kazanimi plani.",
  },
  yag: {
    key: "cutcore",
    text: "Oneri: Cut & Core 5 Gun. Yag yakimi icin direnc + kondisyon kombinasyonu.",
  },
  guc: {
    key: "alpha",
    text: "Oneri: Alpha 3 Gun. Temel kuvveti guvenli ve hizli sekilde yukseltir.",
  },
  atletik: {
    key: "hybrid",
    text: "Oneri: Hybrid 6 Gun. Guc, hiz ve kondisyonu birlikte gelistirir.",
  },
};

const dayOrder = ["pzt", "sali", "cars", "pers", "cuma", "cts", "pazar"];
const dayLabelMap = {
  pzt: "Pazartesi",
  sali: "Sali",
  cars: "Carsamba",
  pers: "Persembe",
  cuma: "Cuma",
  cts: "Cumartesi",
  pazar: "Pazar",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function hashPassword(rawPassword) {
  const text = String(rawPassword ?? "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h_${(hash >>> 0).toString(16)}`;
}

function slugify(text) {
  return String(text ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

function getWeekStartIso(today = new Date()) {
  const date = new Date(today);
  const normalizedDay = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - normalizedDay);
  return date.toISOString().slice(0, 10);
}

function createEmptyWeeklyMetrics(weekStart) {
  const entries = {};
  dayOrder.forEach((dayKey) => {
    entries[dayKey] = {
      weight: null,
      minutes: 0,
      steps: 0,
    };
  });

  return {
    weekStart,
    entries,
  };
}

function normalizeProgram(rawProgram, index = 0) {
  const title = String(rawProgram?.title ?? "").trim();
  const desc = String(rawProgram?.desc ?? "").trim();
  const detail = String(rawProgram?.detail ?? "").trim();
  const tag = String(rawProgram?.tag ?? "Admin Programi").trim();
  const goal = ["kas", "yag", "guc", "atletik"].includes(rawProgram?.goal)
    ? rawProgram.goal
    : "kas";
  const id = String(rawProgram?.id ?? `custom-${Date.now()}-${index}`);
  const keySeed = slugify(rawProgram?.key || title || id) || id;
  const key = `custom-${keySeed}`;
  const days = Array.isArray(rawProgram?.days)
    ? rawProgram.days
        .map((item) => String(item ?? "").trim())
        .filter(Boolean)
        .slice(0, 7)
    : [];

  if (!title || !desc || !days.length) {
    return null;
  }

  return {
    id,
    key,
    title,
    tag,
    goal,
    desc,
    detail: detail || "Progressive overload ve toparlanma dengesini takip et.",
    days,
    createdAt: rawProgram?.createdAt ?? new Date().toISOString(),
    createdBy: rawProgram?.createdBy ?? "admin",
  };
}

function loadCustomPrograms() {
  try {
    const parsed = safeParseJson(localStorage.getItem(customProgramsStorageKey) ?? "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((program, index) => normalizeProgram(program, index))
      .filter((program) => Boolean(program));
  } catch {
    return [];
  }
}

function saveCustomPrograms() {
  try {
    localStorage.setItem(customProgramsStorageKey, JSON.stringify(customPrograms));
  } catch {
    // Ignore storage errors to keep admin panel usable.
  }
}

let customPrograms = loadCustomPrograms();

function renderCustomPrograms() {
  if (!programGrid) {
    return;
  }

  programGrid.querySelectorAll(".program-card.custom-program").forEach((card) => card.remove());

  customPrograms.forEach((program) => {
    const card = document.createElement("article");
    card.className = "program-card custom-program reveal in-view";
    card.dataset.program = program.key;
    card.innerHTML = `
      <p class="program-tag">Admin Eklentisi</p>
      <h3>${escapeHtml(program.title)}</h3>
      <p class="program-desc">${escapeHtml(program.desc)}</p>
      <ul>
        ${program.days.map((day) => `<li>${escapeHtml(day)}</li>`).join("")}
      </ul>
      <button class="toggle-detail" type="button">Detayi Gor</button>
      <div class="program-detail">
        <p>${escapeHtml(program.detail)}</p>
      </div>
    `;
    programGrid.appendChild(card);
  });
}

function loadAuthUsers() {
  try {
    const parsed = safeParseJson(localStorage.getItem(authUsersStorageKey) ?? "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((user) => user && typeof user.email === "string");
  } catch {
    return [];
  }
}

function saveAuthUsers(users) {
  try {
    localStorage.setItem(authUsersStorageKey, JSON.stringify(users));
  } catch {
    // Ignore storage errors to keep UI alive.
  }
}

function loadAuthSession() {
  try {
    const parsed = safeParseJson(localStorage.getItem(authSessionStorageKey) ?? "null");
    if (!parsed || typeof parsed.userId !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveAuthSession(session) {
  try {
    if (!session) {
      localStorage.removeItem(authSessionStorageKey);
      return;
    }
    localStorage.setItem(authSessionStorageKey, JSON.stringify(session));
  } catch {
    // Ignore storage errors.
  }
}

const adminInviteCode = "BKD-ADMIN-2026";
const founderAdminEmails = new Set(["berke@bkd.fit", "fitness@berkekaandinler.com"]);

const openAuthBtn = byId("openAuthBtn");
const authChip = byId("authChip");
const authStatusText = byId("authStatusText");
const authWelcomeText = byId("authWelcomeText");
const authRoleText = byId("authRoleText");
const logoutBtn = byId("logoutBtn");
const registerNameInput = byId("registerNameInput");
const registerEmailInput = byId("registerEmailInput");
const registerPasswordInput = byId("registerPasswordInput");
const registerAdminCodeInput = byId("registerAdminCodeInput");
const registerBtn = byId("registerBtn");
const loginEmailInput = byId("loginEmailInput");
const loginPasswordInput = byId("loginPasswordInput");
const loginBtn = byId("loginBtn");

const adminPanelSection = byId("admin");
const adminAccessInfo = byId("adminAccessInfo");
const adminPanelInner = byId("adminPanelInner");
const adminProgramTitleInput = byId("adminProgramTitleInput");
const adminProgramTagInput = byId("adminProgramTagInput");
const adminProgramGoalInput = byId("adminProgramGoalInput");
const adminProgramDescInput = byId("adminProgramDescInput");
const adminProgramDaysInput = byId("adminProgramDaysInput");
const adminProgramDetailInput = byId("adminProgramDetailInput");
const adminAddProgramBtn = byId("adminAddProgramBtn");
const adminProgramList = byId("adminProgramList");

let authUsers = loadAuthUsers();
let authSession = loadAuthSession();

function getCurrentUser() {
  if (!authSession) {
    return null;
  }
  return authUsers.find((user) => user.id === authSession.userId) ?? null;
}

function isCurrentUserAdmin() {
  const user = getCurrentUser();
  return Boolean(user && user.role === "admin");
}

function renderAdminProgramList() {
  if (!adminProgramList) {
    return;
  }

  if (!customPrograms.length) {
    adminProgramList.innerHTML =
      '<li class="admin-program-empty">Henuz admin panelinden eklenmis ozel program yok.</li>';
    return;
  }

  adminProgramList.innerHTML = customPrograms
    .map((program) => {
      const daySummary = program.days.join(" | ");
      return `
        <li class="admin-program-item">
          <div>
            <p class="admin-program-title">${escapeHtml(program.title)}</p>
            <p class="admin-program-meta">${escapeHtml(daySummary)}</p>
          </div>
          <button class="btn btn-ghost admin-delete-program-btn" type="button" data-program-id="${escapeHtml(
            program.id
          )}">Sil</button>
        </li>
      `;
    })
    .join("");
}

function updateAuthPresentation() {
  const user = getCurrentUser();
  const isAdmin = Boolean(user && user.role === "admin");

  if (authStatusText) {
    authStatusText.textContent = user
      ? "Oturum aktif."
      : "Misafir modundasin.";
  }

  if (authWelcomeText) {
    authWelcomeText.textContent = user
      ? `${user.name} olarak giris yaptin.`
      : "Hesabina giris yaptiginda burada gorunecek.";
  }

  if (authRoleText) {
    authRoleText.textContent = `Rol: ${isAdmin ? "Admin" : user ? "Uye" : "Misafir"}`;
  }

  if (openAuthBtn) {
    openAuthBtn.textContent = user ? "Hesabim" : "Uye Girisi";
  }

  if (authChip) {
    if (user) {
      authChip.classList.remove("hidden");
      authChip.textContent = `${user.name.split(" ")[0]} | ${isAdmin ? "Admin" : "Uye"}`;
    } else {
      authChip.classList.add("hidden");
      authChip.textContent = "Misafir";
    }
  }

  if (logoutBtn) {
    logoutBtn.classList.toggle("hidden", !user);
  }

  if (adminPanelSection && adminAccessInfo && adminPanelInner) {
    adminAccessInfo.textContent = isAdmin
      ? "Admin erisimi aktif. Program olusturma ve yonetim acik."
      : "Bu bolum yalnizca admin rolunde aktif olur.";
    adminPanelInner.classList.toggle("hidden", !isAdmin);
  }

  renderAdminProgramList();
}

function registerUser() {
  const name = String(registerNameInput?.value ?? "").trim();
  const email = normalizeEmail(registerEmailInput?.value ?? "");
  const password = String(registerPasswordInput?.value ?? "");
  const adminCode = String(registerAdminCodeInput?.value ?? "").trim();

  if (name.length < 2 || !email.includes("@") || password.length < 6) {
    showToast("Kayit icin ad, e-posta ve en az 6 karakter sifre gir.");
    return;
  }

  if (authUsers.some((user) => user.email === email)) {
    showToast("Bu e-posta ile zaten bir hesap var.");
    return;
  }

  const role =
    authUsers.length === 0 ||
    adminCode === adminInviteCode ||
    founderAdminEmails.has(email)
      ? "admin"
      : "member";

  const newUser = {
    id: `u-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name,
    email,
    passwordHash: hashPassword(password),
    role,
    createdAt: new Date().toISOString(),
  };

  authUsers = [...authUsers, newUser];
  saveAuthUsers(authUsers);
  authSession = { userId: newUser.id, createdAt: new Date().toISOString() };
  saveAuthSession(authSession);

  if (registerNameInput) registerNameInput.value = "";
  if (registerEmailInput) registerEmailInput.value = "";
  if (registerPasswordInput) registerPasswordInput.value = "";
  if (registerAdminCodeInput) registerAdminCodeInput.value = "";

  updateAuthPresentation();
  showToast(role === "admin" ? "Admin hesabi acildi." : "Uyelik olusturuldu.");
}

function loginUser() {
  const email = normalizeEmail(loginEmailInput?.value ?? "");
  const password = String(loginPasswordInput?.value ?? "");

  if (!email || !password) {
    showToast("Giris icin e-posta ve sifre gir.");
    return;
  }

  const user = authUsers.find(
    (candidate) =>
      candidate.email === email && candidate.passwordHash === hashPassword(password)
  );

  if (!user) {
    showToast("Giris bilgileri hatali.");
    return;
  }

  authSession = { userId: user.id, createdAt: new Date().toISOString() };
  saveAuthSession(authSession);

  if (loginEmailInput) loginEmailInput.value = "";
  if (loginPasswordInput) loginPasswordInput.value = "";

  updateAuthPresentation();
  showToast("Giris basarili.");
}

function logoutUser() {
  authSession = null;
  saveAuthSession(null);
  updateAuthPresentation();
  showToast("Oturum kapatildi.");
}

if (registerBtn) {
  registerBtn.addEventListener("click", registerUser);
}

if (loginBtn) {
  loginBtn.addEventListener("click", loginUser);
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", logoutUser);
}

if (openAuthBtn) {
  openAuthBtn.addEventListener("click", () => {
    const authSection = byId("uyelik");
    if (!authSection) {
      return;
    }
    authSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

if (adminAddProgramBtn) {
  adminAddProgramBtn.addEventListener("click", () => {
    if (!isCurrentUserAdmin()) {
      showToast("Program eklemek icin admin girisi yap.");
      return;
    }

    const title = String(adminProgramTitleInput?.value ?? "").trim();
    const tag = String(adminProgramTagInput?.value ?? "").trim() || "Admin Programi";
    const goal = String(adminProgramGoalInput?.value ?? "kas");
    const desc = String(adminProgramDescInput?.value ?? "").trim();
    const detail = String(adminProgramDetailInput?.value ?? "").trim();
    const days = String(adminProgramDaysInput?.value ?? "")
      .split(/\n|,/g)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 7);

    const normalized = normalizeProgram({
      id: `custom-${Date.now()}`,
      key: slugify(title),
      title,
      tag,
      goal,
      desc,
      detail,
      days,
      createdBy: getCurrentUser()?.email ?? "admin",
      createdAt: new Date().toISOString(),
    });

    if (!normalized) {
      showToast("Program adi, aciklama ve gunleri doldur.");
      return;
    }

    customPrograms = [normalized, ...customPrograms];
    saveCustomPrograms();
    renderCustomPrograms();
    renderAdminProgramList();
    applyRecommendationByGoal(goalSelect?.value ?? "kas");
    updateCommandCenter();

    if (adminProgramTitleInput) adminProgramTitleInput.value = "";
    if (adminProgramTagInput) adminProgramTagInput.value = "";
    if (adminProgramDescInput) adminProgramDescInput.value = "";
    if (adminProgramDetailInput) adminProgramDetailInput.value = "";
    if (adminProgramDaysInput) adminProgramDaysInput.value = "";

    showToast("Yeni program yayinlandi.");
  });
}

if (adminProgramList) {
  adminProgramList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".admin-delete-program-btn");
    if (!deleteButton) {
      return;
    }

    if (!isCurrentUserAdmin()) {
      showToast("Bu islem icin admin girisi gerekli.");
      return;
    }

    const programId = deleteButton.dataset.programId;
    if (!programId) {
      return;
    }

    customPrograms = customPrograms.filter((program) => program.id !== programId);
    saveCustomPrograms();
    renderCustomPrograms();
    renderAdminProgramList();
    applyRecommendationByGoal(goalSelect?.value ?? "kas");
    updateCommandCenter();
    showToast("Program kaldirildi.");
  });
}

function applyRecommendationByGoal(goalKey) {
  const customMatch = customPrograms.find((program) => program.goal === goalKey);
  const data = customMatch
    ? {
        key: customMatch.key,
        text: `Oneri: ${customMatch.title}. Admin panelinde hedefe gore eklenen en guncel program.`,
      }
    : recommendations[goalKey];

  if (!data) {
    return null;
  }

  if (recommendationText) {
    recommendationText.textContent = data.text;
  }

  getProgramCards().forEach((card) => {
    card.classList.toggle("recommended", card.dataset.program === data.key);
  });

  return data;
}

if (recommendButton && goalSelect && recommendationText) {
  recommendButton.addEventListener("click", () => {
    applyRecommendationByGoal(goalSelect.value);
    updateCommandCenter();
    showToast("Hedefe gore program onerisi guncellendi.");
  });
}

const todayDateEl = byId("todayDate");
const todayProgramOutput = byId("todayProgramOutput");
const todayTrackerOutput = byId("todayTrackerOutput");
const todayFocusOutput = byId("todayFocusOutput");

function getFavoriteCountForCommandCenter() {
  if (typeof favoriteExercises === "undefined" || !favoriteExercises) {
    return 0;
  }
  return favoriteExercises.size;
}

function setTrackerOutputForCommandCenter(completed, total) {
  if (!todayTrackerOutput) {
    return;
  }

  if (!total) {
    todayTrackerOutput.textContent = "Haftalik checkpoint verisi bekleniyor.";
    return;
  }

  const percentage = Math.round((completed / total) * 100);
  if (completed === 0) {
    todayTrackerOutput.textContent = "Takip paneli: henuz baslamadi (%0).";
    return;
  }

  if (completed >= total) {
    todayTrackerOutput.textContent = `Takip paneli: haftalik hedef tamamlandi (%${percentage}).`;
    return;
  }

  todayTrackerOutput.textContent = `Takip paneli: ${completed}/${total} tamamlandi (%${percentage}).`;
}

function getProgramTitleByKey(key) {
  if (!key) {
    return "Program secimi bekleniyor.";
  }

  const title = document.querySelector(`.program-card[data-program="${key}"] h3`);
  return title ? title.textContent.trim() : key;
}

function getTodayFocusText() {
  const day = new Date().getDay();
  const focusByDay = {
    0: "Pazar: Mobility + hafif yuruyus + toparlanma.",
    1: "Pazartesi: Ana guc liftlerine odaklan.",
    2: "Sali: Cekis hareketlerinde form kalitesi.",
    3: "Carsamba: Bacak gucu + core stabilitesi.",
    4: "Persembe: Aktif toparlanma + teknik tekrar.",
    5: "Cuma: Ust vucut hacim ve tempo kontrolu.",
    6: "Cumartesi: Kondisyon + zayif bolge tamamlama.",
  };

  return focusByDay[day] ?? "Bugun odak: teknik kalite ve sureklilik.";
}

function updateCommandCenter() {
  if (todayDateEl) {
    const today = new Date();
    todayDateEl.textContent = today.toLocaleDateString("tr-TR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const selectedGoal = goalSelect?.value ?? "kas";
  const recommendation =
    customPrograms.find((program) => program.goal === selectedGoal) ??
    recommendations[selectedGoal];
  if (todayProgramOutput && recommendation) {
    todayProgramOutput.textContent = `Bugun icin ana plan: ${getProgramTitleByKey(
      recommendation.key
    )}.`;
  }

  if (todayFocusOutput) {
    const favoriteCount = getFavoriteCountForCommandCenter();
    const favoriteSuffix =
      favoriteCount > 0
        ? ` Favori hareket havuzu: ${favoriteCount} hareket.`
        : " Favori listeni olusturup tekrar kullanabilirsin.";
    todayFocusOutput.textContent = `${getTodayFocusText()}${favoriteSuffix}`;
  }
}

if (goalSelect) {
  goalSelect.addEventListener("change", () => {
    applyRecommendationByGoal(goalSelect.value);
    saveProfileState();
    updateCommandCenter();
  });
}

function saveProfileState() {
  const profile = {
    age: Number.parseInt(byId("ageInput")?.value ?? "24", 10),
    gender: byId("genderInput")?.value ?? "male",
    weight: Number.parseFloat(byId("weightInput")?.value ?? "78"),
    height: Number.parseFloat(byId("heightInput")?.value ?? "178"),
    activity: Number.parseFloat(byId("activityInput")?.value ?? "1.55"),
    goal: byId("goalInput")?.value ?? "maintain",
    waterWeight: Number.parseFloat(byId("waterWeightInput")?.value ?? "78"),
    waterTraining: Number.parseFloat(byId("waterTrainingInput")?.value ?? "60"),
    rmWeight: Number.parseFloat(byId("rmWeightInput")?.value ?? "80"),
    rmReps: Number.parseInt(byId("rmRepsInput")?.value ?? "6", 10),
    plannerGoal: byId("goalSelect")?.value ?? "kas",
  };

  try {
    localStorage.setItem(profileStorageKey, JSON.stringify(profile));
  } catch {
    // Keep functionality even if storage is blocked.
  }
}

function loadProfileState() {
  let raw = null;
  try {
    raw = localStorage.getItem(profileStorageKey);
  } catch {
    return;
  }

  if (!raw) {
    return;
  }

  const profile = safeParseJson(raw);
  if (!profile) {
    return;
  }

  if (byId("ageInput")) byId("ageInput").value = String(profile.age ?? 24);
  if (byId("genderInput")) byId("genderInput").value = profile.gender ?? "male";
  if (byId("weightInput")) byId("weightInput").value = String(profile.weight ?? 78);
  if (byId("heightInput")) byId("heightInput").value = String(profile.height ?? 178);
  if (byId("activityInput")) byId("activityInput").value = String(profile.activity ?? 1.55);
  if (byId("goalInput")) byId("goalInput").value = profile.goal ?? "maintain";
  if (byId("waterWeightInput")) byId("waterWeightInput").value = String(profile.waterWeight ?? 78);
  if (byId("waterTrainingInput")) byId("waterTrainingInput").value = String(profile.waterTraining ?? 60);
  if (byId("rmWeightInput")) byId("rmWeightInput").value = String(profile.rmWeight ?? 80);
  if (byId("rmRepsInput")) byId("rmRepsInput").value = String(profile.rmReps ?? 6);
  if (goalSelect && profile.plannerGoal) goalSelect.value = profile.plannerGoal;
}

function calculateCaloriesAndMacros() {
  const age = Number.parseInt(byId("ageInput")?.value ?? "", 10);
  const gender = byId("genderInput")?.value ?? "male";
  const weight = Number.parseFloat(byId("weightInput")?.value ?? "");
  const height = Number.parseFloat(byId("heightInput")?.value ?? "");
  const activity = Number.parseFloat(byId("activityInput")?.value ?? "");
  const goal = byId("goalInput")?.value ?? "maintain";
  const calorieOutput = byId("calorieOutput");
  const macroOutput = byId("macroOutput");

  if (!Number.isFinite(age) || !Number.isFinite(weight) || !Number.isFinite(height) || !Number.isFinite(activity)) {
    if (calorieOutput) calorieOutput.textContent = "Lutfen tum alanlari gecerli degerle doldur.";
    if (macroOutput) macroOutput.textContent = "Makro hesaplamak icin once kalori hesapla.";
    return;
  }

  const bmrBase = 10 * weight + 6.25 * height - 5 * age;
  const bmr = gender === "female" ? bmrBase - 161 : bmrBase + 5;
  const maintenance = bmr * activity;
  const targetCalories =
    goal === "bulk" ? maintenance + 300 : goal === "cut" ? maintenance - 400 : maintenance;

  const proteinMultiplier = goal === "cut" ? 2.2 : goal === "bulk" ? 2.0 : 1.9;
  const fatMultiplier = goal === "cut" ? 0.8 : 0.9;
  const proteinGr = Math.round(weight * proteinMultiplier);
  const fatGr = Math.round(weight * fatMultiplier);
  const carbsGr = Math.max(
    0,
    Math.round((targetCalories - proteinGr * 4 - fatGr * 9) / 4)
  );

  if (calorieOutput) {
    calorieOutput.textContent = `Gunluk hedef kalori: ${Math.round(targetCalories)} kcal (bakim: ${Math.round(
      maintenance
    )} kcal).`;
  }
  if (macroOutput) {
    macroOutput.textContent = `Makrolar -> Protein: ${proteinGr} g | Karbonhidrat: ${carbsGr} g | Yag: ${fatGr} g.`;
  }

  saveProfileState();
}

const calcNutritionBtn = byId("calcNutritionBtn");
if (calcNutritionBtn) {
  calcNutritionBtn.addEventListener("click", () => {
    calculateCaloriesAndMacros();
    showToast("Kalori ve makro hesaplandi.");
  });
}

function calculateOneRepMax() {
  const weight = Number.parseFloat(byId("rmWeightInput")?.value ?? "");
  const reps = Number.parseInt(byId("rmRepsInput")?.value ?? "", 10);
  const rmOutput = byId("rmOutput");
  const oneRmTable = byId("oneRmTable");

  if (!Number.isFinite(weight) || !Number.isFinite(reps) || reps < 1) {
    if (rmOutput) rmOutput.textContent = "Lutfen agirlik ve tekrar degerlerini kontrol et.";
    if (oneRmTable) oneRmTable.innerHTML = "";
    return;
  }

  const limitedReps = Math.min(Math.max(reps, 1), 15);
  const oneRm = weight * (1 + limitedReps / 30);

  if (rmOutput) {
    rmOutput.textContent = `Tahmini 1RM: ${oneRm.toFixed(1)} kg`;
  }

  if (oneRmTable) {
    const percentages = [95, 90, 85, 80, 75, 70];
    oneRmTable.innerHTML = percentages
      .map((percentage) => {
        const load = ((oneRm * percentage) / 100).toFixed(1);
        return `<tr><td>%${percentage}</td><td>${load}</td></tr>`;
      })
      .join("");
  }

  saveProfileState();
}

const calc1rmBtn = byId("calc1rmBtn");
if (calc1rmBtn) {
  calc1rmBtn.addEventListener("click", () => {
    calculateOneRepMax();
    showToast("1RM tablosu guncellendi.");
  });
}

function calculateWaterIntake() {
  const weight = Number.parseFloat(byId("waterWeightInput")?.value ?? "");
  const trainingMinutes = Number.parseFloat(byId("waterTrainingInput")?.value ?? "");
  const waterOutput = byId("waterOutput");

  if (!Number.isFinite(weight) || !Number.isFinite(trainingMinutes)) {
    if (waterOutput) waterOutput.textContent = "Lutfen gecerli kilo ve sure degeri gir.";
    return;
  }

  const liters = weight * 0.035 + (trainingMinutes / 60) * 0.7;
  if (waterOutput) {
    waterOutput.textContent = `Gunluk su hedefi: ${liters.toFixed(2)} litre`;
  }

  saveProfileState();
}

const calcWaterBtn = byId("calcWaterBtn");
if (calcWaterBtn) {
  calcWaterBtn.addEventListener("click", () => {
    calculateWaterIntake();
    showToast("Su ihtiyaci hesaplandi.");
  });
}

const exerciseDataset = [
  {
    id: "bench-press",
    name: "Bench Press",
    muscle: "gogus",
    equipment: "barbell",
    level: "intermediate",
    note: "Temel guc hareketi.",
    image: "media/3837743.jpg",
    video: "https://www.youtube.com/results?search_query=bench+press+proper+form",
  },
  {
    id: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    muscle: "gogus",
    equipment: "dumbbell",
    level: "beginner",
    note: "Ust gogus odagi.",
    image: "media/2261476.jpg",
    video: "https://www.youtube.com/results?search_query=incline+dumbbell+press+form",
  },
  {
    id: "cable-fly",
    name: "Cable Fly",
    muscle: "gogus",
    equipment: "cable",
    level: "beginner",
    note: "Kasilma hissini artirir.",
    image: "media/11433060.jpg",
    video: "https://www.youtube.com/results?search_query=cable+fly+proper+form",
  },
  {
    id: "pull-up",
    name: "Pull-up",
    muscle: "sirt",
    equipment: "bodyweight",
    level: "intermediate",
    note: "Genislik odakli cekis.",
    image: "media/3490363.jpg",
    video: "https://www.youtube.com/results?search_query=pull+up+form+tutorial",
  },
  {
    id: "barbell-row",
    name: "Barbell Row",
    muscle: "sirt",
    equipment: "barbell",
    level: "intermediate",
    note: "Sirt kalinligini destekler.",
    image: "media/2261477.jpg",
    video: "https://www.youtube.com/results?search_query=barbell+row+proper+form",
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    muscle: "sirt",
    equipment: "machine",
    level: "beginner",
    note: "Teknik kontrolu kolay.",
    image: "media/949132.jpg",
    video: "https://www.youtube.com/results?search_query=lat+pulldown+proper+form",
  },
  {
    id: "overhead-press",
    name: "Overhead Press",
    muscle: "omuz",
    equipment: "barbell",
    level: "intermediate",
    note: "Omuz ve core stabilitesi.",
    image: "media/2261485.jpg",
    video: "https://www.youtube.com/results?search_query=overhead+press+tutorial",
  },
  {
    id: "lateral-raise",
    name: "Lateral Raise",
    muscle: "omuz",
    equipment: "dumbbell",
    level: "beginner",
    note: "Yan omuz izolasyonu.",
    image: "media/791763.jpg",
    video: "https://www.youtube.com/results?search_query=lateral+raise+form",
  },
  {
    id: "face-pull",
    name: "Face Pull",
    muscle: "omuz",
    equipment: "cable",
    level: "beginner",
    note: "Arka omuz ve postur.",
    image: "media/841130.jpg",
    video: "https://www.youtube.com/results?search_query=face+pull+proper+form",
  },
  {
    id: "back-squat",
    name: "Back Squat",
    muscle: "bacak",
    equipment: "barbell",
    level: "intermediate",
    note: "Alt vucut guc temeli.",
    image: "media/4720555.jpg",
    video: "https://www.youtube.com/results?search_query=squat+technique+tutorial",
  },
  {
    id: "leg-press",
    name: "Leg Press",
    muscle: "bacak",
    equipment: "machine",
    level: "beginner",
    note: "Yuksek hacim icin uygun.",
    image: "media/8032754.jpg",
    video: "https://www.youtube.com/results?search_query=leg+press+proper+form",
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    muscle: "bacak",
    equipment: "barbell",
    level: "intermediate",
    note: "Hamstring-kalca odagi.",
    image: "media/2261477.jpg",
    video: "https://www.youtube.com/results?search_query=romanian+deadlift+form",
  },
  {
    id: "ez-bar-curl",
    name: "EZ Bar Curl",
    muscle: "kol",
    equipment: "barbell",
    level: "beginner",
    note: "Biceps hacim hareketi.",
    image: "media/1431282.jpg",
    video: "https://www.youtube.com/results?search_query=ez+bar+curl+proper+form",
  },
  {
    id: "hammer-curl",
    name: "Hammer Curl",
    muscle: "kol",
    equipment: "dumbbell",
    level: "beginner",
    note: "Brachialis hedefler.",
    image: "media/841131.jpg",
    video: "https://www.youtube.com/results?search_query=hammer+curl+proper+form",
  },
  {
    id: "rope-pushdown",
    name: "Rope Pushdown",
    muscle: "kol",
    equipment: "cable",
    level: "beginner",
    note: "Triceps izolasyonu.",
    image: "media/11433060.jpg",
    video: "https://www.youtube.com/results?search_query=rope+triceps+pushdown+form",
  },
  {
    id: "plank",
    name: "Plank",
    muscle: "core",
    equipment: "bodyweight",
    level: "beginner",
    note: "Temel core dayaniklilik.",
    image: "media/1552242.jpg",
    video: "https://www.youtube.com/results?search_query=plank+core+technique",
  },
  {
    id: "ab-wheel",
    name: "Ab Wheel",
    muscle: "core",
    equipment: "bodyweight",
    level: "intermediate",
    note: "Anti-extension guc.",
    image: "media/1552242.jpg",
    video: "https://www.youtube.com/results?search_query=ab+wheel+rollout+form",
  },
  {
    id: "cable-crunch",
    name: "Cable Crunch",
    muscle: "core",
    equipment: "cable",
    level: "beginner",
    note: "Yuklenebilir core hareketi.",
    image: "media/1552242.jpg",
    video: "https://www.youtube.com/results?search_query=cable+crunch+proper+form",
  },
];

const muscleLabelMap = {
  gogus: "Gogus",
  sirt: "Sirt",
  omuz: "Omuz",
  bacak: "Bacak",
  kol: "Kol",
  core: "Core",
};

const equipmentLabelMap = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  machine: "Machine",
  bodyweight: "Bodyweight",
  cable: "Cable",
};

const levelLabelMap = {
  beginner: "Baslangic",
  intermediate: "Orta",
  advanced: "Ileri",
};

const exerciseSearch = byId("exerciseSearch");
const exerciseMuscleFilter = byId("exerciseMuscleFilter");
const exerciseEquipmentFilter = byId("exerciseEquipmentFilter");
const exerciseCount = byId("exerciseCount");
const exerciseResults = byId("exerciseResults");
const favoriteOnlyBtn = byId("favoriteOnlyBtn");

let favoriteOnlyMode = false;
let favoriteExercises = loadFavoriteExercises();
let libraryRenderTimeout = null;

function loadFavoriteExercises() {
  try {
    const parsed = safeParseJson(localStorage.getItem(favoritesStorageKey) ?? "[]");
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.filter((item) => typeof item === "string"));
  } catch {
    return new Set();
  }
}

function saveFavoriteExercises() {
  try {
    localStorage.setItem(favoritesStorageKey, JSON.stringify([...favoriteExercises]));
  } catch {
    // Keep UI functional when storage is not writable.
  }
}

function syncFavoriteButtonState() {
  if (!favoriteOnlyBtn) {
    return;
  }

  favoriteOnlyBtn.classList.toggle("active", favoriteOnlyMode);
  favoriteOnlyBtn.textContent = favoriteOnlyMode ? "Tum Hareketler" : "Sadece Favoriler";
}

function scheduleExerciseLibraryRender() {
  clearTimeout(libraryRenderTimeout);
  libraryRenderTimeout = setTimeout(() => {
    renderExerciseLibrary();
  }, 110);
}

function renderExerciseLibrary() {
  if (!exerciseResults) {
    return;
  }

  const query = (exerciseSearch?.value ?? "").trim().toLowerCase();
  const muscle = exerciseMuscleFilter?.value ?? "all";
  const equipment = exerciseEquipmentFilter?.value ?? "all";

  const filtered = exerciseDataset.filter((exercise) => {
    const queryHit =
      !query ||
      exercise.name.toLowerCase().includes(query) ||
      exercise.note.toLowerCase().includes(query);
    const muscleHit = muscle === "all" || exercise.muscle === muscle;
    const equipmentHit = equipment === "all" || exercise.equipment === equipment;
    const favoriteHit = !favoriteOnlyMode || favoriteExercises.has(exercise.id);
    return queryHit && muscleHit && equipmentHit && favoriteHit;
  });

  if (exerciseCount) {
    const favoriteInfo = favoriteExercises.size ? ` | Favori: ${favoriteExercises.size}` : "";
    exerciseCount.textContent = `${filtered.length} hareket bulundu.${favoriteInfo}`;
  }

  if (!filtered.length) {
    exerciseResults.innerHTML = favoriteOnlyMode
      ? '<div class="library-empty">Favori listen bos. Kartlardaki "Favorile" butonunu kullan.</div>'
      : '<div class="library-empty">Filtrelere uygun hareket bulunamadi. Aramayi genislet.</div>';
    return;
  }

  exerciseResults.innerHTML = filtered
    .map((exercise) => {
      const isFavorite = favoriteExercises.has(exercise.id);
      return `
        <article class="exercise-card">
          <img class="exercise-preview" src="${exercise.image}" alt="${exercise.name} hareket gorseli" loading="lazy" decoding="async" />
          <div class="exercise-card-head">
            <h3 class="exercise-title">${exercise.name}</h3>
            <button
              class="favorite-btn ${isFavorite ? "is-active" : ""}"
              type="button"
              data-action="toggle-favorite"
              data-exercise-id="${exercise.id}"
              aria-pressed="${isFavorite ? "true" : "false"}"
            >
              ${isFavorite ? "Favori" : "Favorile"}
            </button>
          </div>
          <div class="exercise-meta">
            <span class="exercise-pill">${muscleLabelMap[exercise.muscle] ?? exercise.muscle}</span>
            <span class="exercise-pill">${equipmentLabelMap[exercise.equipment] ?? exercise.equipment}</span>
            <span class="exercise-pill">${levelLabelMap[exercise.level] ?? exercise.level}</span>
          </div>
          <p class="exercise-note">${exercise.note}</p>
          <a class="video-link-btn exercise-video-link" href="${exercise.video}" target="_blank" rel="noopener noreferrer">
            Form Videosu
          </a>
        </article>
      `;
    })
    .join("");
}

[exerciseSearch, exerciseMuscleFilter, exerciseEquipmentFilter].forEach((element) => {
  if (!element) {
    return;
  }
  element.addEventListener("input", scheduleExerciseLibraryRender);
  element.addEventListener("change", renderExerciseLibrary);
});

if (favoriteOnlyBtn) {
  favoriteOnlyBtn.addEventListener("click", () => {
    favoriteOnlyMode = !favoriteOnlyMode;
    syncFavoriteButtonState();
    renderExerciseLibrary();
  });
}

if (exerciseResults) {
  exerciseResults.addEventListener("click", (event) => {
    const favoriteButton = event.target.closest('button[data-action="toggle-favorite"]');
    if (!favoriteButton) {
      return;
    }

    const exerciseId = favoriteButton.dataset.exerciseId;
    if (!exerciseId) {
      return;
    }

    if (favoriteExercises.has(exerciseId)) {
      favoriteExercises.delete(exerciseId);
    } else {
      favoriteExercises.add(exerciseId);
    }

    saveFavoriteExercises();
    renderExerciseLibrary();
    updateCommandCenter();
  });
}

syncFavoriteButtonState();
renderExerciseLibrary();

const sessionMuscleSelect = byId("sessionMuscleSelect");
const sessionDurationSelect = byId("sessionDurationSelect");
const buildSessionBtn = byId("buildSessionBtn");
const sessionPlanList = byId("sessionPlanList");
const sessionProgress = byId("sessionProgress");

let sessionPlanState = loadSessionPlanState();

function loadSessionPlanState() {
  try {
    const parsed = safeParseJson(localStorage.getItem(sessionPlanStorageKey) ?? "null");
    if (!parsed || !Array.isArray(parsed.steps) || !parsed.steps.length) {
      return null;
    }

    return {
      muscle: parsed.muscle ?? "gogus",
      duration: Number(parsed.duration) || 45,
      steps: parsed.steps
        .filter((step) => typeof step?.text === "string")
        .map((step, index) => ({
          id: step.id ?? `saved-step-${index}`,
          text: step.text,
          done: Boolean(step.done),
        })),
      createdAt: parsed.createdAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function saveSessionPlanState() {
  if (!sessionPlanState || !sessionPlanState.steps?.length) {
    return;
  }

  try {
    localStorage.setItem(sessionPlanStorageKey, JSON.stringify(sessionPlanState));
  } catch {
    // Ignore storage errors and keep session generator usable.
  }
}

function buildSessionPlan(muscle, duration) {
  const safeDuration = Math.max(30, Math.min(60, Number(duration) || 45));
  const moveCount = safeDuration >= 60 ? 5 : safeDuration >= 45 ? 4 : 3;
  const mainSet = safeDuration >= 60 ? "4 set x 8-10 tekrar" : "3 set x 10-12 tekrar";
  const auxSet = safeDuration >= 60 ? "3 set x 12-15 tekrar" : "2 set x 12-15 tekrar";

  const pool = exerciseDataset
    .filter((exercise) => exercise.muscle === muscle)
    .sort(() => Math.random() - 0.5);
  const chosen = pool.slice(0, moveCount);

  const cooldown = safeDuration >= 60 ? 8 : 6;
  const warmup = safeDuration >= 45 ? 7 : 5;
  const stamp = Date.now();

  const steps = [
    {
      id: `warmup-${stamp}`,
      text: `${warmup} dk dinamik isinma + eklem mobilitesi`,
      done: false,
    },
    ...chosen.map((exercise, index) => ({
      id: `${exercise.id}-${stamp}-${index}`,
      text: `${exercise.name} | ${index < 2 ? mainSet : auxSet}`,
      done: false,
    })),
    {
      id: `cooldown-${stamp}`,
      text: `${cooldown} dk soguma + nefes toparlama`,
      done: false,
    },
  ];

  return {
    muscle,
    duration: safeDuration,
    steps,
    createdAt: new Date().toISOString(),
  };
}

function renderSessionPlan() {
  if (!sessionPlanList || !sessionProgress) {
    return;
  }

  if (!sessionPlanState || !sessionPlanState.steps?.length) {
    sessionPlanList.innerHTML =
      '<li class="library-empty">Hedef bolge ve sure secip "Seans Olustur" butonuna bas.</li>';
    sessionProgress.textContent = "Plan olusturup adimlari isaretle.";
    return;
  }

  sessionPlanList.innerHTML = sessionPlanState.steps
    .map((step, index) => {
      const inputId = `session-step-${index}`;
      return `
        <li class="session-step">
          <input id="${inputId}" type="checkbox" data-step-id="${step.id}" ${step.done ? "checked" : ""} />
          <label for="${inputId}">${step.text}</label>
        </li>
      `;
    })
    .join("");

  const total = sessionPlanState.steps.length;
  const completed = sessionPlanState.steps.filter((step) => step.done).length;
  const percentage = Math.round((completed / total) * 100);
  const muscleLabel = muscleLabelMap[sessionPlanState.muscle] ?? sessionPlanState.muscle;
  sessionProgress.textContent = `${muscleLabel} | ${sessionPlanState.duration} dk | ${completed}/${total} adim tamamlandi (%${percentage}).`;
}

function buildSessionFromInputs(showFeedback) {
  if (!sessionMuscleSelect || !sessionDurationSelect) {
    return;
  }

  sessionPlanState = buildSessionPlan(sessionMuscleSelect.value, sessionDurationSelect.value);
  saveSessionPlanState();
  renderSessionPlan();

  if (showFeedback) {
    showToast("Hizli seans plani olusturuldu.");
  }
}

if (buildSessionBtn) {
  buildSessionBtn.addEventListener("click", () => {
    buildSessionFromInputs(true);
  });
}

if (sessionPlanList) {
  sessionPlanList.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") {
      return;
    }

    const stepId = target.dataset.stepId;
    if (!stepId || !sessionPlanState?.steps?.length) {
      return;
    }

    const step = sessionPlanState.steps.find((item) => item.id === stepId);
    if (!step) {
      return;
    }

    step.done = target.checked;
    saveSessionPlanState();
    renderSessionPlan();
  });
}

if (sessionPlanState) {
  if (sessionMuscleSelect) sessionMuscleSelect.value = sessionPlanState.muscle;
  if (sessionDurationSelect) sessionDurationSelect.value = String(sessionPlanState.duration);
}

renderSessionPlan();

const mealPlanOutput = byId("mealPlanOutput");
const mealPlanButtons = document.querySelectorAll(".apply-meal-plan");
const mealPlanTexts = {
  bulk: "Secilen plan: Kas Kazanimi Paketi. Odak: haftalik agirlik artisi + yeterli karbonhidrat.",
  cut: "Secilen plan: Yag Yakim Paketi. Odak: protein yuksek, kalori kontrollu, lif agirlikli.",
  performance: "Secilen plan: Atletik Performans Paketi. Odak: antrenman etrafinda dengeli yakit.",
};

function setMealPlan(planKey) {
  const text = mealPlanTexts[planKey];
  if (!text) {
    return;
  }

  if (mealPlanOutput) {
    mealPlanOutput.textContent = text;
  }

  try {
    localStorage.setItem(mealPlanStorageKey, planKey);
  } catch {
    // Ignore local storage errors.
  }
}

mealPlanButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setMealPlan(button.dataset.mealPlan ?? "");
    showToast("Beslenme paketi secildi.");
  });
});

try {
  const savedMealPlan = localStorage.getItem(mealPlanStorageKey);
  if (savedMealPlan) {
    setMealPlan(savedMealPlan);
  }
} catch {
  // Ignore local storage errors.
}

const faqButtons = document.querySelectorAll(".faq-trigger");
faqButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const container = button.closest(".faq-item");
    if (!container) {
      return;
    }

    container.classList.toggle("open");
  });
});

const trackerChecks = document.querySelectorAll(".tracker-check");
const trackerFill = byId("trackerFill");
const trackerSummary = byId("trackerSummary");
const trackerReset = byId("trackerReset");

function renderTrackerProgress() {
  if (!trackerChecks.length || !trackerFill || !trackerSummary) {
    return;
  }

  const total = trackerChecks.length;
  const completed = [...trackerChecks].filter((checkbox) => checkbox.checked).length;
  const percentage = Math.round((completed / total) * 100);

  trackerSummary.textContent = `${completed} / ${total} tamamlandi. (${percentage}%)`;
  trackerFill.style.width = `${percentage}%`;
  setTrackerOutputForCommandCenter(completed, total);
}

function saveTrackerState() {
  if (!trackerChecks.length) {
    return;
  }

  const state = {};
  trackerChecks.forEach((checkbox) => {
    state[checkbox.dataset.id] = checkbox.checked;
  });

  try {
    localStorage.setItem(trackerStorageKey, JSON.stringify(state));
  } catch {
    // Ignore storage errors and keep tracker usable in-memory.
  }
}

function loadTrackerState() {
  if (!trackerChecks.length) {
    return;
  }

  let raw = null;
  try {
    raw = localStorage.getItem(trackerStorageKey);
  } catch {
    renderTrackerProgress();
    return;
  }

  const state = raw ? safeParseJson(raw) : null;
  if (state) {
    trackerChecks.forEach((checkbox) => {
      checkbox.checked = Boolean(state[checkbox.dataset.id]);
    });
  }

  renderTrackerProgress();
}

trackerChecks.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    saveTrackerState();
    renderTrackerProgress();
    updateCommandCenter();
  });
});

if (trackerReset) {
  trackerReset.addEventListener("click", () => {
    trackerChecks.forEach((checkbox) => {
      checkbox.checked = false;
    });
    saveTrackerState();
    renderTrackerProgress();
    updateCommandCenter();
    showToast("Haftalik takip sifirlandi.");
  });
}

loadTrackerState();

const metricDaySelect = byId("metricDaySelect");
const metricWeightInput = byId("metricWeightInput");
const metricMinutesInput = byId("metricMinutesInput");
const metricStepsInput = byId("metricStepsInput");
const saveMetricBtn = byId("saveMetricBtn");
const resetMetricWeekBtn = byId("resetMetricWeekBtn");
const weeklySummaryOutput = byId("weeklySummaryOutput");
const weeklyChartCanvas = byId("weeklyChartCanvas");

let weeklyMetricsState = loadWeeklyMetricsState();
let weeklyChart = null;

function loadWeeklyMetricsState() {
  const currentWeekStart = getWeekStartIso();
  try {
    const parsed = safeParseJson(localStorage.getItem(weeklyMetricsStorageKey) ?? "null");
    if (!parsed || typeof parsed !== "object") {
      return createEmptyWeeklyMetrics(currentWeekStart);
    }

    if (parsed.weekStart !== currentWeekStart || !parsed.entries) {
      return createEmptyWeeklyMetrics(currentWeekStart);
    }

    const normalized = createEmptyWeeklyMetrics(currentWeekStart);
    dayOrder.forEach((dayKey) => {
      const item = parsed.entries?.[dayKey];
      if (!item) {
        return;
      }

      const weight = Number.parseFloat(item.weight);
      const minutes = Number.parseFloat(item.minutes);
      const steps = Number.parseFloat(item.steps);

      normalized.entries[dayKey] = {
        weight: Number.isFinite(weight) ? weight : null,
        minutes: Number.isFinite(minutes) ? Math.max(0, minutes) : 0,
        steps: Number.isFinite(steps) ? Math.max(0, steps) : 0,
      };
    });

    return normalized;
  } catch {
    return createEmptyWeeklyMetrics(currentWeekStart);
  }
}

function saveWeeklyMetricsState() {
  try {
    localStorage.setItem(weeklyMetricsStorageKey, JSON.stringify(weeklyMetricsState));
  } catch {
    // Ignore storage errors.
  }
}

function getTodayMetricKey() {
  const index = (new Date().getDay() + 6) % 7;
  return dayOrder[index] ?? "pzt";
}

function setMetricInputsFromSelectedDay() {
  const selectedDay = metricDaySelect?.value;
  if (!selectedDay || !weeklyMetricsState.entries[selectedDay]) {
    return;
  }

  const entry = weeklyMetricsState.entries[selectedDay];
  if (metricWeightInput) {
    metricWeightInput.value = Number.isFinite(entry.weight) ? String(entry.weight) : "";
  }
  if (metricMinutesInput) {
    metricMinutesInput.value = String(entry.minutes ?? 0);
  }
  if (metricStepsInput) {
    metricStepsInput.value = String(entry.steps ?? 0);
  }
}

function renderWeeklySummary() {
  if (!weeklySummaryOutput) {
    return;
  }

  const entries = dayOrder.map((dayKey) => weeklyMetricsState.entries[dayKey]);
  const weightValues = entries
    .map((entry) => entry.weight)
    .filter((value) => Number.isFinite(value));
  const minutesValues = entries.map((entry) => entry.minutes || 0);
  const stepsValues = entries.map((entry) => entry.steps || 0);

  const avgWeight = weightValues.length
    ? (weightValues.reduce((sum, value) => sum + value, 0) / weightValues.length).toFixed(1)
    : "-";
  const totalMinutes = minutesValues.reduce((sum, value) => sum + value, 0);
  const totalSteps = stepsValues.reduce((sum, value) => sum + value, 0);
  const bestDayIndex = stepsValues.indexOf(Math.max(...stepsValues));
  const bestDayLabel = dayOrder[bestDayIndex] ? dayLabelMap[dayOrder[bestDayIndex]] : "-";

  weeklySummaryOutput.textContent = `Ort. kilo: ${avgWeight} kg | Toplam antrenman: ${totalMinutes} dk | Toplam adim: ${totalSteps} | En aktif gun: ${bestDayLabel}`;
}

function renderWeeklyChart() {
  if (!weeklyChartCanvas) {
    return;
  }

  if (typeof Chart === "undefined") {
    if (weeklySummaryOutput) {
      weeklySummaryOutput.textContent = "Grafik kutuphanesi yuklenemedi. Sayfayi yenile.";
    }
    return;
  }

  const labels = dayOrder.map((key) => dayLabelMap[key]);
  const weightData = dayOrder.map((dayKey) => weeklyMetricsState.entries[dayKey].weight);
  const minutesData = dayOrder.map((dayKey) => weeklyMetricsState.entries[dayKey].minutes || 0);
  const stepsData = dayOrder.map((dayKey) => weeklyMetricsState.entries[dayKey].steps || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Kilo (kg)",
        data: weightData,
        borderColor: "#ff5b2e",
        backgroundColor: "rgba(255, 91, 46, 0.14)",
        yAxisID: "y",
        tension: 0.25,
      },
      {
        label: "Antrenman (dk)",
        data: minutesData,
        borderColor: "#0b7a73",
        backgroundColor: "rgba(11, 122, 115, 0.13)",
        yAxisID: "y1",
        tension: 0.25,
      },
      {
        label: "Adim",
        data: stepsData,
        borderColor: "#e7b04b",
        backgroundColor: "rgba(231, 176, 75, 0.18)",
        yAxisID: "y2",
        tension: 0.25,
      },
    ],
  };

  if (weeklyChart) {
    weeklyChart.data = chartData;
    weeklyChart.update();
    return;
  }

  weeklyChart = new Chart(weeklyChartCanvas, {
    type: "line",
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#2a2722",
          },
        },
      },
      scales: {
        x: {
          ticks: { color: "#3d3933" },
          grid: { color: "rgba(80, 74, 66, 0.12)" },
        },
        y: {
          position: "left",
          ticks: { color: "#a63b1b" },
          grid: { color: "rgba(166, 59, 27, 0.12)" },
        },
        y1: {
          position: "right",
          ticks: { color: "#125f5a" },
          grid: { drawOnChartArea: false },
        },
        y2: {
          position: "right",
          ticks: { color: "#8d6519" },
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
}

function renderWeeklyMetricsPanel() {
  setMetricInputsFromSelectedDay();
  renderWeeklySummary();
  renderWeeklyChart();
}

if (metricDaySelect) {
  metricDaySelect.value = getTodayMetricKey();
  metricDaySelect.addEventListener("change", () => {
    setMetricInputsFromSelectedDay();
  });
}

if (saveMetricBtn) {
  saveMetricBtn.addEventListener("click", () => {
    const dayKey = metricDaySelect?.value;
    if (!dayKey || !weeklyMetricsState.entries[dayKey]) {
      showToast("Gun secimi gecersiz.");
      return;
    }

    const weight = Number.parseFloat(metricWeightInput?.value ?? "");
    const minutes = Number.parseFloat(metricMinutesInput?.value ?? "");
    const steps = Number.parseFloat(metricStepsInput?.value ?? "");

    weeklyMetricsState.entries[dayKey] = {
      weight: Number.isFinite(weight) ? weight : null,
      minutes: Number.isFinite(minutes) ? Math.max(0, minutes) : 0,
      steps: Number.isFinite(steps) ? Math.max(0, steps) : 0,
    };

    saveWeeklyMetricsState();
    renderWeeklyMetricsPanel();
    showToast(`${dayLabelMap[dayKey]} verisi kaydedildi.`);
  });
}

if (resetMetricWeekBtn) {
  resetMetricWeekBtn.addEventListener("click", () => {
    weeklyMetricsState = createEmptyWeeklyMetrics(getWeekStartIso());
    saveWeeklyMetricsState();
    if (metricDaySelect) {
      metricDaySelect.value = getTodayMetricKey();
    }
    renderWeeklyMetricsPanel();
    showToast("Haftalik analiz verileri sifirlandi.");
  });
}

renderWeeklyMetricsPanel();

const restSecondsInput = byId("restSeconds");
const timerDisplay = byId("timerDisplay");
const timerStart = byId("timerStart");
const timerPause = byId("timerPause");
const timerReset = byId("timerReset");

let timerHandle = null;
let remainingSeconds = 90;

function clampTimerValue(value) {
  return Math.min(300, Math.max(15, value));
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function paintTimer() {
  if (!timerDisplay) {
    return;
  }
  timerDisplay.textContent = formatTime(remainingSeconds);
}

function syncTimerFromInput() {
  if (!restSecondsInput) {
    return;
  }

  const parsed = Number.parseInt(restSecondsInput.value, 10);
  const safeValue = Number.isFinite(parsed) ? clampTimerValue(parsed) : 90;
  restSecondsInput.value = String(safeValue);
  remainingSeconds = safeValue;
  paintTimer();
}

function stopTimer() {
  if (!timerHandle) {
    return;
  }
  clearInterval(timerHandle);
  timerHandle = null;
}

if (restSecondsInput && timerDisplay && timerStart && timerPause && timerReset) {
  syncTimerFromInput();
  restSecondsInput.addEventListener("change", () => {
    if (!timerHandle) {
      syncTimerFromInput();
    }
    saveProfileState();
  });

  timerStart.addEventListener("click", () => {
    if (timerHandle) {
      return;
    }

    if (remainingSeconds <= 0) {
      syncTimerFromInput();
    }

    timerHandle = setInterval(() => {
      remainingSeconds -= 1;
      paintTimer();
      if (remainingSeconds <= 0) {
        stopTimer();
        showToast("Dinlenme suresi bitti.");
      }
    }, 1000);
  });

  timerPause.addEventListener("click", () => {
    stopTimer();
  });

  timerReset.addEventListener("click", () => {
    stopTimer();
    syncTimerFromInput();
  });
}

const exportDataBtn = byId("exportDataBtn");
const importDataInput = byId("importDataInput");
const printPlanBtn = byId("printPlanBtn");

if (exportDataBtn) {
  exportDataBtn.addEventListener("click", () => {
    const trackerState = {};
    trackerChecks.forEach((checkbox) => {
      trackerState[checkbox.dataset.id] = checkbox.checked;
    });

    let storedProfile = null;
    let storedMealPlan = null;
    let storedFavorites = null;
    let storedSessionPlan = null;
    try {
      storedProfile = safeParseJson(localStorage.getItem(profileStorageKey) ?? "null");
      storedMealPlan = localStorage.getItem(mealPlanStorageKey);
      storedFavorites = safeParseJson(localStorage.getItem(favoritesStorageKey) ?? "null");
      storedSessionPlan = safeParseJson(localStorage.getItem(sessionPlanStorageKey) ?? "null");
    } catch {
      storedProfile = null;
      storedMealPlan = null;
      storedFavorites = null;
      storedSessionPlan = null;
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      profile: storedProfile,
      tracker: trackerState,
      mealPlan: storedMealPlan,
      favorites: storedFavorites,
      sessionPlan: storedSessionPlan,
      customPrograms,
      weeklyMetrics: weeklyMetricsState,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bkd-fitness-data.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Veri disa aktarildi.");
  });
}

if (importDataInput) {
  importDataInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const raw = await file.text();
    const payload = safeParseJson(raw);
    if (!payload) {
      showToast("Gecersiz JSON dosyasi.");
      return;
    }

    if (payload.profile) {
      localStorage.setItem(profileStorageKey, JSON.stringify(payload.profile));
      loadProfileState();
    }

    if (payload.mealPlan && mealPlanTexts[payload.mealPlan]) {
      setMealPlan(payload.mealPlan);
    }

    if (Array.isArray(payload.favorites)) {
      favoriteExercises = new Set(payload.favorites.filter((item) => typeof item === "string"));
      saveFavoriteExercises();
      renderExerciseLibrary();
    }

    if (payload.sessionPlan && Array.isArray(payload.sessionPlan.steps)) {
      sessionPlanState = {
        muscle: payload.sessionPlan.muscle ?? "gogus",
        duration: Number(payload.sessionPlan.duration) || 45,
        steps: payload.sessionPlan.steps
          .filter((step) => typeof step?.text === "string")
          .map((step, index) => ({
            id: step.id ?? `imported-step-${index}`,
            text: step.text,
            done: Boolean(step.done),
          })),
        createdAt: payload.sessionPlan.createdAt ?? new Date().toISOString(),
      };
      if (sessionMuscleSelect) sessionMuscleSelect.value = sessionPlanState.muscle;
      if (sessionDurationSelect) sessionDurationSelect.value = String(sessionPlanState.duration);
      saveSessionPlanState();
      renderSessionPlan();
    }

    if (Array.isArray(payload.customPrograms)) {
      customPrograms = payload.customPrograms
        .map((program, index) => normalizeProgram(program, index))
        .filter((program) => Boolean(program));
      saveCustomPrograms();
      renderCustomPrograms();
      renderAdminProgramList();
    }

    if (payload.weeklyMetrics && payload.weeklyMetrics.entries) {
      const incomingWeekStart =
        typeof payload.weeklyMetrics.weekStart === "string"
          ? payload.weeklyMetrics.weekStart
          : getWeekStartIso();
      const normalizedMetrics = createEmptyWeeklyMetrics(incomingWeekStart);
      dayOrder.forEach((dayKey) => {
        const item = payload.weeklyMetrics.entries?.[dayKey];
        if (!item) {
          return;
        }
        const weight = Number.parseFloat(item.weight);
        const minutes = Number.parseFloat(item.minutes);
        const steps = Number.parseFloat(item.steps);
        normalizedMetrics.entries[dayKey] = {
          weight: Number.isFinite(weight) ? weight : null,
          minutes: Number.isFinite(minutes) ? Math.max(0, minutes) : 0,
          steps: Number.isFinite(steps) ? Math.max(0, steps) : 0,
        };
      });
      weeklyMetricsState = normalizedMetrics;
      saveWeeklyMetricsState();
      renderWeeklyMetricsPanel();
    }

    if (payload.tracker && typeof payload.tracker === "object") {
      trackerChecks.forEach((checkbox) => {
        checkbox.checked = Boolean(payload.tracker[checkbox.dataset.id]);
      });
      saveTrackerState();
      renderTrackerProgress();
    }

    calculateCaloriesAndMacros();
    calculateOneRepMax();
    calculateWaterIntake();
    applyRecommendationByGoal(goalSelect?.value ?? "kas");
    updateCommandCenter();
    showToast("Veri basariyla ice aktarildi.");
    importDataInput.value = "";
  });
}

if (printPlanBtn) {
  printPlanBtn.addEventListener("click", () => {
    window.print();
  });
}

loadProfileState();
renderCustomPrograms();
if (authSession && !getCurrentUser()) {
  authSession = null;
  saveAuthSession(null);
}
updateAuthPresentation();
if (goalSelect) {
  applyRecommendationByGoal(goalSelect.value);
}
calculateCaloriesAndMacros();
calculateOneRepMax();
calculateWaterIntake();
updateCommandCenter();

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("in-view"));
}

const scrollProgress = byId("scrollProgress");
const backToTop = byId("backToTop");
let progressTicking = false;

function updateScrollProgress() {
  if (scrollProgress) {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    scrollProgress.style.width = `${progress}%`;
  }

  if (backToTop) {
    backToTop.classList.toggle("visible", window.scrollY > 520);
  }

  progressTicking = false;
}

window.addEventListener(
  "scroll",
  () => {
    if (progressTicking) {
      return;
    }
    progressTicking = true;
    window.requestAnimationFrame(updateScrollProgress);
  },
  { passive: true }
);

if (backToTop) {
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

updateScrollProgress();

const sectionNavLinks = [...document.querySelectorAll('.topnav a[href^="#"], .mobile-dock a[href^="#"]')].filter((link) => {
  const href = link.getAttribute("href");
  return Boolean(href && href.length > 1);
});

function setActiveNavLink(hash) {
  sectionNavLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === hash);
  });
}

const sectionIds = [...new Set(sectionNavLinks.map((link) => link.getAttribute("href").slice(1)))];
const sections = sectionIds
  .map((id) => byId(id))
  .filter((section) => Boolean(section));

if (sections.length && "IntersectionObserver" in window) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visibleEntry?.target?.id) {
        return;
      }
      setActiveNavLink(`#${visibleEntry.target.id}`);
    },
    { rootMargin: "-28% 0px -55% 0px", threshold: [0.15, 0.35, 0.6] }
  );

  sections.forEach((section) => navObserver.observe(section));
}

setActiveNavLink(window.location.hash || "#home");

window.addEventListener("hashchange", () => {
  setActiveNavLink(window.location.hash || "#home");
});

window.addEventListener("keydown", (event) => {
  const activeElement = document.activeElement;
  const activeTag = activeElement?.tagName;
  const typingInField =
    activeElement?.isContentEditable ||
    activeTag === "INPUT" ||
    activeTag === "TEXTAREA" ||
    activeTag === "SELECT";

  if (
    event.key === "/" &&
    !typingInField &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    event.preventDefault();
    if (exerciseSearch) {
      exerciseSearch.focus();
      exerciseSearch.select();
    }
  }

  if (event.key === "Escape" && activeElement === exerciseSearch) {
    exerciseSearch.blur();
  }
});

let deferredInstallPrompt = null;
const installAppBtn = byId("installAppBtn");

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  if (installAppBtn) {
    installAppBtn.classList.remove("hidden");
  }
});

if (installAppBtn) {
  installAppBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      showToast("Cihaz su an kurulum onermiyor.");
      return;
    }

    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    if (choice.outcome === "accepted") {
      showToast("Uygulama kurulumu baslatildi.");
    } else {
      showToast("Kurulum ertelendi.");
    }

    deferredInstallPrompt = null;
    installAppBtn.classList.add("hidden");
  });
}

window.addEventListener("appinstalled", () => {
  if (installAppBtn) {
    installAppBtn.classList.add("hidden");
  }
  showToast("Uygulama basariyla yuklendi.");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update().catch(() => {}))
      .catch(() => {
        // Silent failure to avoid noisy UX.
      });
  });
}
