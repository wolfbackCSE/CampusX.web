// ==========================================================================
// CampusX — Student Skill Exchange (Application Engine)
// Preserves full Supabase schema & RPCs while delivering an app-first UX
// ==========================================================================

const CATEGORIES = ["All", "Tutoring", "Resume Review", "Photo / Video", "Coding", "Graphic Design", "Writing", "Other"];

// High-fidelity initial demo listings with authentic avatars and student data
const demoListings = [
  {
    id: "d1",
    created_at: "2026-08-27T12:00:00Z",
    title: "Python tutoring & algorithm fundamentals",
    category: "Coding",
    description: "1-to-1 help with Python basics, assignments, debugging, data structures and exam preparation. Tailored for 1st & 2nd year students.",
    price: "৳500 / hr",
    student_name: "Nadia Rahman",
    contact_info: "Telegram: @nadiacodes • Email: nadia.rahman@univ.edu",
    avatar_url: "/src/assets/images/student_nadia_avatar_1791640974570.jpg",
    university: "University of Dhaka",
    department: "Computer Science & Engineering",
    skills: "Python, Algorithms, Data Structures, Django",
    bio: "3rd-year CS student with 2 years of mentoring experience. Passionate about helping fellow students master programming and ace technical courses.",
    rating: 5.0,
    review_count: 8
  },
  {
    id: "d2",
    created_at: "2026-08-26T15:30:00Z",
    title: "Professional tech CV & resume review",
    category: "Resume Review",
    description: "I will review your technical CV, improve wording, quantify impacts, fix formatting, and ensure high ATS readability for internships.",
    price: "৳350 flat",
    student_name: "Arif Hasan",
    contact_info: "Email: arif.hasan@univ.edu",
    avatar_url: "/src/assets/images/student_arif_avatar_1791640995559.jpg",
    university: "BUET",
    department: "Software Engineering",
    skills: "Resume Writing, Career Coaching, LinkedIn Optimization",
    bio: "Outgoing software engineering student with internships at top local tech companies. Helped over 30 peers land interviews.",
    rating: 4.9,
    review_count: 12
  },
  {
    id: "d3",
    created_at: "2026-08-25T11:15:00Z",
    title: "Event photography & portraits for campus clubs",
    category: "Photo / Video",
    description: "Affordable photo coverage for seminars, campus fests, club competitions, and graduation portraits with high-res editing.",
    price: "৳1,200 / event",
    student_name: "Sadia Islam",
    contact_info: "WhatsApp: +880 1700 000000",
    avatar_url: "/src/assets/images/student_sadia_avatar_1791641010034.jpg",
    university: "NSU",
    department: "Media & Journalism",
    skills: "Portrait Photography, Event Coverage, Lightroom, Photoshop",
    bio: "Campus club photographer. Love capturing real moments, candid student interactions, and clean editorial portraits.",
    rating: 5.0,
    review_count: 5
  },
  {
    id: "d4",
    created_at: "2026-08-24T09:20:00Z",
    title: "Calculus & introductory statistics tutoring",
    category: "Tutoring",
    description: "Weekly interactive sessions for freshman calculus, differential equations, and introductory statistics with practice problem sets.",
    price: "৳450 / hr",
    student_name: "Tanvir Ahmed",
    contact_info: "Telegram: @tanvirlearns",
    university: "University of Dhaka",
    department: "Mathematics",
    skills: "Calculus I & II, Linear Algebra, Probability",
    bio: "Top 5% student in mathematics department. Known for breaking down complex proofs into intuitive visual steps.",
    rating: 4.8,
    review_count: 6
  },
  {
    id: "d5",
    created_at: "2026-08-23T19:00:00Z",
    title: "Poster, banner & social media design",
    category: "Graphic Design",
    description: "Clean modern posters, club event flyers, presentation decks, and social media graphics designed in Figma & Illustrator.",
    price: "Starts at ৳600",
    student_name: "Maliha Noor",
    contact_info: "Email: maliha.design@univ.edu",
    university: "BRAC University",
    department: "Design & Architecture",
    skills: "Figma, Illustrator, Brand Identity, Slide Decks",
    bio: "Visual designer working with campus organizations and student startups. Focus on typography, grid balance, and punchy layouts.",
    rating: 4.9,
    review_count: 9
  },
  {
    id: "d6",
    created_at: "2026-08-22T13:10:00Z",
    title: "Frontend website debugging & UI fixing",
    category: "Coding",
    description: "Help with HTML, Tailwind CSS, JavaScript bug fixing, responsive mobile layouts, and debugging React components.",
    price: "৳400 / hr (or trade)",
    student_name: "Rafi Khan",
    contact_info: "WhatsApp: +880 1800 000000",
    university: "IUT",
    department: "Computer Science",
    skills: "HTML/CSS, JavaScript, React, Tailwind CSS",
    bio: "Frontend enthusiast who loves responsive UI. Ready to fix your project's broken layout or buggy JavaScript.",
    rating: 5.0,
    review_count: 4
  }
];

const $ = id => document.getElementById(id);
const cfg = window.CAMPUSX_CONFIG || {};
const connected = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
const sb = connected ? supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;

let state = {
  user: null,
  listings: [],
  category: "All",
  sort: "newest",
  query: "",
  signupMode: false,
  profile: null,
  publicProfile: null,
  publicListing: null,
  reviews: [],
  canReview: false,
  hires: [],
  threads: [],
  activeThread: null,
  messages: [],
  workspace: "provider",
  messageChannel: null,
  notificationChannel: null,
  notifications: [],
  activeTab: "marketplace"
};

// ==========================================================================
// Toast Notification System (replaces disruptive window.alert)
// ==========================================================================
function showToast(message, type = "info", duration = 3500) {
  const container = $("toastContainer");
  if (!container) return;
  
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  const iconMap = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ"
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || "ℹ"}</span>
    <span class="toast-text">${safe(message)}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.style.transition = "all 0.2s ease";
    setTimeout(() => toast.remove(), 220);
  }, duration);
}

// Security sanitization helper
function safe(v = "") {
  return String(v ?? "").replace(/[&<>"']/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[s]));
}

function initials(name = "User") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase() || "U";
}

function openModal(id) {
  const el = $(id);
  if (!el) return;
  el.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  const el = $(id);
  if (!el) return;
  el.classList.add("hidden");
  el.classList.remove("show-threads");
  document.body.style.overflow = "";
}

function setAvatar(el, url, name) {
  if (!el) return;
  el.innerHTML = "";
  if (url) {
    const img = document.createElement("img");
    img.src = url;
    img.alt = name || "Student";
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.onerror = () => {
      el.innerHTML = "";
      el.textContent = initials(name);
    };
    el.appendChild(img);
  } else {
    el.textContent = initials(name);
  }
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function profileName() {
  return state.profile?.full_name || state.user?.user_metadata?.full_name || state.user?.email?.split("@")[0] || "Student";
}

function demoKey(prefix) {
  return `campusx-${prefix}-${state.user?.id || "demo-user"}`;
}

function isUuid(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v || "");
}

function requireLogin(message = "Log in to continue.") {
  if (state.user) return true;
  setAuthMode(false);
  if ($("authMsg")) $("authMsg").textContent = message;
  openModal("authModal");
  showToast(message, "info");
  return false;
}

// ==========================================================================
// Theme Management
// ==========================================================================
function applyTheme(theme) {
  const value = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = value;
  localStorage.setItem("campusx-theme", value);
  if ($("themeIcon")) $("themeIcon").textContent = value === "dark" ? "☀" : "☾";
  if ($("themeLabel")) $("themeLabel").textContent = value === "dark" ? "Light" : "Dark";
}

function initTheme() {
  const saved = localStorage.getItem("campusx-theme");
  const preferred = saved || ((window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light");
  applyTheme(preferred);
}

function extractEmail(v = "") {
  const m = String(v || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return m ? m[0].toLowerCase() : "";
}

// ==========================================================================
// File Uploads (Supabase Storage fallback)
// ==========================================================================
async function uploadProfileFile(file, folder) {
  if (!sb || !state.user) return null;
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${state.user.id}/${folder}/${Date.now()}.${ext}`;
  const bucket = sb.storage.from("profile-files");
  const { error } = await bucket.upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
    cacheControl: "3600"
  });
  if (error) {
    showToast(`Photo upload note: ${error.message}`, "warning");
    return null;
  }
  const { data } = bucket.getPublicUrl(path);
  return data?.publicUrl || null;
}

function demoPublicProfile(item) {
  return {
    id: item.provider_id || item.student_name,
    full_name: item.student_name,
    university: item.university || "CampusX Student Provider",
    department: item.department || item.category,
    bio: item.bio || item.description,
    skills: item.skills || item.category,
    mobile: item.contact_info,
    email: item.contact_info?.includes("@") ? item.contact_info.replace(/^.*Email:\s*/i, "") : "",
    portfolio_url: item.portfolio_url || "",
    avatar_url: item.avatar_url || "",
    cv_url: item.cv_url || ""
  };
}

async function resolveCurrentProvider() {
  if (!sb || !state.publicListing || !isUuid(state.publicListing.id)) {
    return state.publicProfile?.id || state.publicListing?.provider_id || null;
  }
  if (isUuid(state.publicListing.provider_id)) return state.publicListing.provider_id;
  try {
    const { data, error } = await sb.rpc("resolve_legacy_listing_provider", { target_listing: state.publicListing.id });
    if (!error && isUuid(data)) {
      state.publicListing.provider_id = data;
      const local = state.listings.find(x => String(x.id) === String(state.publicListing.id));
      if (local) local.provider_id = data;
      const { data: profile } = await sb.from("profiles").select("*").eq("id", data).maybeSingle();
      state.publicProfile = { ...demoPublicProfile(state.publicListing), ...(profile || {}), id: data };
      renderPublicProfile();
      return data;
    }
  } catch (_) {}
  return null;
}

// ==========================================================================
// Provider Profile View
// ==========================================================================
async function openProvider(item, focusContact = false) {
  state.publicListing = item;
  if (sb && !isUuid(item.provider_id) && isUuid(item.id)) {
    try {
      const { data: resolved } = await sb.rpc("resolve_legacy_listing_provider", { target_listing: item.id });
      if (isUuid(resolved)) item.provider_id = resolved;
    } catch (_) {}
  }
  
  let p = demoPublicProfile(item);
  if (sb) {
    let data = null;
    const email = extractEmail(item.contact_info);
    if (item.provider_id) {
      ({ data } = await sb.from("profiles").select("*").eq("id", item.provider_id).maybeSingle());
    }
    if (!data && item.student_name) {
      ({ data } = await sb.from("profiles").select("*").ilike("full_name", item.student_name.trim()).limit(1).maybeSingle());
    }
    if (!data && email) {
      ({ data } = await sb.from("profiles").select("*").ilike("email", email).limit(1).maybeSingle());
    }
    if (!data && state.user) {
      const mineByEmail = email && state.user.email?.toLowerCase() === email;
      const mineByName = item.student_name?.trim().toLowerCase() === profileName().trim().toLowerCase();
      if (mineByEmail || mineByName) {
        data = { ...state.profile, id: state.user.id, email: state.user.email || state.profile?.email || "" };
      }
    }
    if (data) p = { ...p, ...data, id: data.id || item.provider_id || p.id };
  } else if (state.user && (item.provider_id === state.user.id || item.student_name === state.profile?.full_name)) {
    p = { ...p, ...state.profile, id: state.user.id, email: state.user.email || state.profile?.email || "" };
  }

  state.publicProfile = p;
  $("feedPage").classList.add("hidden");
  $("profilePage").classList.add("hidden");
  $("providerPage").classList.remove("hidden");
  
  renderPublicProfile();
  await loadReviews();
  await checkReviewPermission();
  window.scrollTo({ top: 0, behavior: "smooth" });
  
  if (focusContact) {
    setTimeout(() => $("publicContact")?.scrollIntoView({ behavior: "smooth", block: "center" }), 180);
  }
}

function renderPublicProfile() {
  const p = state.publicProfile || {};
  const item = state.publicListing || {};
  const nm = p.full_name || item.student_name || "Student";
  
  $("publicName").textContent = nm;
  $("publicUniversity").textContent = [p.university, p.department].filter(Boolean).join(" • ") || "Student provider";
  $("publicBio").textContent = p.bio || item.description || "Student service provider on CampusX.";
  $("publicSkills").textContent = p.skills ? `Skills: ${p.skills}` : "";
  setAvatar($("publicAvatar"), p.avatar_url || item.avatar_url, nm);

  const contacts = [];
  if (p.mobile || p.contact_info) {
    contacts.push(`<div><span class="text-dim" style="font-size:0.75rem; text-transform:uppercase; font-weight:700;">Mobile / Contact</span><div style="font-weight:700; margin-top:2px;">${safe(p.mobile || p.contact_info)}</div></div>`);
  }
  if (p.email) {
    contacts.push(`<div><span class="text-dim" style="font-size:0.75rem; text-transform:uppercase; font-weight:700;">Email</span><div style="margin-top:2px;"><a style="color:var(--accent); font-weight:700;" href="mailto:${safe(p.email)}">${safe(p.email)}</a></div></div>`);
  }
  if (p.portfolio_url) {
    contacts.push(`<div><span class="text-dim" style="font-size:0.75rem; text-transform:uppercase; font-weight:700;">Portfolio</span><div style="margin-top:2px;"><a style="color:var(--primary-teal); font-weight:700;" target="_blank" rel="noopener" href="${safe(p.portfolio_url)}">Open Portfolio ↗</a></div></div>`);
  }
  
  $("publicContact").innerHTML = contacts.join("") || '<div style="color:var(--text-dim); font-size:0.88rem;">No public direct contact added. Use CampusX in-app chat instead.</div>';
  $("publicCV").innerHTML = p.cv_url
    ? `<a class="button secondary small" target="_blank" rel="noopener" href="${safe(p.cv_url)}">📄 View CV / Resume ↗</a>`
    : '<span style="color:var(--text-dim); font-size:0.88rem;">No CV uploaded yet.</span>';
  $("hireName").textContent = nm;
}

// ==========================================================================
// Reviews & Ratings
// ==========================================================================
async function loadReviews() {
  const key = state.publicProfile?.id || state.publicListing?.provider_id || state.publicListing?.student_name;
  if (sb && isUuid(state.publicProfile?.id)) {
    const { data } = await sb.from("profile_reviews").select("*").eq("profile_id", state.publicProfile.id).order("created_at", { ascending: false });
    state.reviews = data || [];
  } else {
    state.reviews = JSON.parse(localStorage.getItem(`campusx-reviews-${key}`) || "[]");
  }
  renderReviews();
}

function renderReviews() {
  const rs = state.reviews || [];
  const avg = rs.length ? rs.reduce((a, b) => a + Number(b.rating || 0), 0) / rs.length : 0;
  $("publicRating").textContent = rs.length ? `★ ${avg.toFixed(1)} · ${rs.length} review${rs.length === 1 ? "" : "s"}` : "★ New Provider";
  
  $("experienceList").innerHTML = rs.length
    ? rs.map(r => `
      <div style="padding:14px; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md); margin-bottom:10px;">
        <div style="color:var(--warning); font-weight:800; font-size:0.9rem;">
          ${"★".repeat(Number(r.rating || 0))}<span style="opacity:0.25;">${"★".repeat(5 - Number(r.rating || 0))}</span>
        </div>
        <p style="margin-top:6px; font-size:0.88rem; color:var(--text);">${safe(r.message)}</p>
        <div style="margin-top:6px; font-size:0.75rem; color:var(--text-dim); font-weight:600;">— ${safe(r.reviewer_name || "Campus client")}</div>
      </div>
    `).join("")
    : '<div class="empty-state">No client feedback yet for this student.</div>';
}

async function checkReviewPermission() {
  state.canReview = false;
  if (!state.user) {
    updateReviewUI();
    return;
  }
  const pid = state.publicProfile?.id || state.publicListing?.provider_id;
  if (String(state.user.id) === String(pid)) {
    updateReviewUI("You cannot review your own provider portfolio.");
    return;
  }
  if (sb && isUuid(pid)) {
    const { data, error } = await sb.from("hire_requests").select("id,status").eq("client_id", state.user.id).eq("provider_id", pid).eq("status", "completed").limit(1);
    if (error) console.warn("Could not check completed hire:", error.message);
    state.canReview = !!data?.length;
  } else {
    const hires = JSON.parse(localStorage.getItem(demoKey("hires")) || "[]");
    state.canReview = hires.some(h => String(h.provider_key || h.provider_id) === String(pid) && h.status === "completed");
  }
  updateReviewUI();
}

function updateReviewUI(custom) {
  const disabled = !state.canReview;
  $("reviewRating").disabled = disabled;
  $("reviewMessage").disabled = disabled;
  $("reviewSubmit").disabled = disabled;
  $("reviewSubmit").style.opacity = disabled ? "0.5" : "1";
  $("reviewSubmit").style.cursor = disabled ? "not-allowed" : "pointer";
  $("reviewHint").textContent = custom || (state.canReview ? "✓ Work marked complete — feedback unlocked." : "Reviews unlock after the provider marks your hired work complete.");
}

// ==========================================================================
// Marketplace Listings & Filters
// ==========================================================================
function renderFilters() {
  $("filters").innerHTML = CATEGORIES.map(c => `
    <button data-cat="${safe(c)}" class="filter-btn ${state.category === c ? "active" : ""}">
      ${safe(c)}
    </button>
  `).join("");
  
  document.querySelectorAll("[data-cat]").forEach(b => {
    b.onclick = () => {
      state.category = b.dataset.cat;
      renderFilters();
      renderListings();
    };
  });
}

function filtered() {
  const q = state.query.trim().toLowerCase();
  let items = state.listings.filter(x => {
    const matchCat = state.category === "All" || x.category === state.category;
    const matchQuery = !q || `${x.title} ${x.description} ${x.student_name} ${x.category} ${x.university || ""}`.toLowerCase().includes(q);
    return matchCat && matchQuery;
  });

  if (state.sort === "price-low") {
    items.sort((a, b) => {
      const numA = parseInt(String(a.price).replace(/\D/g, "")) || 0;
      const numB = parseInt(String(b.price).replace(/\D/g, "")) || 0;
      return numA - numB;
    });
  } else if (state.sort === "price-high") {
    items.sort((a, b) => {
      const numA = parseInt(String(a.price).replace(/\D/g, "")) || 0;
      const numB = parseInt(String(b.price).replace(/\D/g, "")) || 0;
      return numB - numA;
    });
  } else {
    // Newest first
    items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }
  return items;
}

function renderListings() {
  const items = filtered();
  $("count").textContent = `${items.length} active service${items.length === 1 ? "" : "s"} listed`;
  
  if (!items.length) {
    $("grid").innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 48px 24px;">
        <h3 style="font-size: 1.15rem; margin-bottom: 6px;">No listings found for this search</h3>
        <p>Try searching for a different skill or reset your category filter.</p>
      </div>
    `;
    return;
  }

  $("grid").innerHTML = items.map((x, i) => {
    const dateFormatted = x.created_at
      ? new Date(x.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "Active";
    
    return `
      <article class="skill-card" data-id="${safe(x.id)}">
        <!-- Unboxed metadata row -->
        <div class="card-meta-row">
          <span class="card-category">${safe(x.category)}</span>
          <span class="card-divider" aria-hidden="true">·</span>
          <span>${safe(x.university || "Campus Provider")}</span>
          <span class="card-divider" aria-hidden="true">·</span>
          <span class="tabular-nums">${safe(dateFormatted)}</span>
        </div>

        <h3>${safe(x.title)}</h3>
        <p>${safe(x.description)}</p>

        <!-- Provider row with avatar & price -->
        <div class="card-provider-row">
          <div class="provider-info">
            <span class="avatar mini" id="cardAvatar-${i}"></span>
            <div class="provider-text">
              <span class="provider-name">${safe(x.student_name)}</span>
              <span class="provider-sub">${x.rating ? `★ ${x.rating.toFixed(1)}` : "Verified Student"}</span>
            </div>
          </div>
          <div class="card-price tabular-nums">${safe(x.price)}</div>
        </div>

        <button data-id="${safe(x.id)}" class="contact" type="button">
          View Profile &amp; Contact
        </button>
      </article>
    `;
  }).join("");

  // Inject avatars safely
  items.forEach((x, i) => {
    const el = document.getElementById(`cardAvatar-${i}`);
    if (el) setAvatar(el, x.avatar_url, x.student_name);
  });

  document.querySelectorAll(".contact").forEach(b => {
    b.onclick = e => {
      e.stopPropagation();
      const item = state.listings.find(x => String(x.id) === b.dataset.id);
      if (item) openProvider(item, true);
    };
  });

  document.querySelectorAll(".skill-card").forEach(card => {
    card.onclick = () => {
      const item = state.listings.find(x => String(x.id) === card.dataset.id);
      if (item) openProvider(item);
    };
  });

  renderProfileListings();
}

async function loadListings() {
  if (!sb) {
    state.listings = [...demoListings];
    renderListings();
    return;
  }
  const { data, error } = await sb.from("skill_listings").select("*").order("created_at", { ascending: false });
  state.listings = error || !data || !data.length ? [...demoListings] : data;
  renderListings();
}

// ==========================================================================
// Authentication State
// ==========================================================================
function setAuthMode(signup) {
  state.signupMode = signup;
  $("name").classList.toggle("hidden", !signup);
  $("authTitle").textContent = signup ? "Create your student account" : "Welcome back";
  $("authSubmit").textContent = signup ? "Sign up" : "Log in";
  $("loginTab").classList.toggle("active", !signup);
  $("signupTab").classList.toggle("active", signup);
}

function updateUser(user) {
  state.user = user || null;
  const loggedIn = !!user;
  document.body.classList.toggle("auth-required", !loggedIn);
  
  if ($("login")) $("login").classList.toggle("hidden", loggedIn);
  if ($("signup")) $("signup").classList.toggle("hidden", loggedIn);
  if ($("authNavButtons")) $("authNavButtons").classList.toggle("hidden", loggedIn);
  if ($("userMenuWrap")) $("userMenuWrap").classList.toggle("hidden", !loggedIn);
  if ($("profileBtn")) $("profileBtn").classList.toggle("hidden", !loggedIn);
  if ($("hiresBtn")) $("hiresBtn").classList.toggle("hidden", true); // Removed from top bar
  if ($("inboxBtn")) $("inboxBtn").classList.toggle("hidden", !loggedIn);
  if ($("notificationWrap")) $("notificationWrap").classList.toggle("hidden", !loggedIn);
  if ($("logout")) $("logout").classList.toggle("hidden", !loggedIn);

  // Sync mobile bottom nav badge
  if ($("bottomNavInboxCount")) $("bottomNavInboxCount").classList.toggle("hidden", !loggedIn);

  if (loggedIn) {
    closeModal("authModal");
    const nm = user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";
    setAvatar($("profileAvatarMini"), user.user_metadata?.avatar_url, nm);
    setAvatar($("dropdownAvatarMini"), user.user_metadata?.avatar_url, nm);
    if ($("dropdownUserName")) $("dropdownUserName").textContent = nm;
    if ($("dropdownUserEmail")) $("dropdownUserEmail").textContent = user.email || "";
    if ($("studentName")) $("studentName").value = nm;
    if ($("uniEmail")) $("uniEmail").value = user.email || "";
    loadHires();
    loadInboxSummary();
    subscribeNotifications();
    showToast(`Welcome, ${nm}!`, "success");
  } else {
    setAuthMode(false);
    state.notifications = [];
    renderNotifications();
    closeUserMenu();
    if (sb && state.notificationChannel) {
      sb.removeChannel(state.notificationChannel);
      state.notificationChannel = null;
    }
  }
}

async function loadProfile() {
  if (!state.user) return;
  const fallback = {
    id: state.user.id || "demo-user",
    full_name: state.user.user_metadata?.full_name || state.user.email?.split("@")[0] || "Student",
    university: "",
    department: "",
    bio: "",
    skills: "",
    contact_info: "",
    mobile: "",
    portfolio_url: "",
    avatar_url: "",
    cv_url: "",
    email: state.user.email || ""
  };
  
  if (!sb) {
    state.profile = { ...fallback, ...JSON.parse(localStorage.getItem("campusx-demo-profile") || "{}") };
    renderProfile();
    return;
  }
  
  const { data, error } = await sb.from("profiles").select("*").eq("id", state.user.id).maybeSingle();
  if (error) {
    state.profile = fallback;
  } else if (!data) {
    const { data: created, error: createError } = await sb.from("profiles").upsert(fallback, { onConflict: "id" }).select().single();
    state.profile = createError ? fallback : { ...fallback, ...created };
  } else {
    state.profile = { ...fallback, ...data, email: data.email || state.user.email || "" };
  }
  renderProfile();
  await claimLegacyListings();
}

async function claimLegacyListings() {
  if (!sb || !state.user || !state.profile) return;
  try {
    await sb.rpc("claim_my_legacy_listings");
    const { data } = await sb.from("skill_listings").select("*").order("created_at", { ascending: false });
    if (data) {
      state.listings = data;
      renderListings();
    }
  } catch (_) {}
}

function renderProfile() {
  const p = state.profile || {};
  const nm = p.full_name || "Student";
  
  $("profileName").textContent = nm;
  $("profileCardName").textContent = nm;
  $("profileUniversity").textContent = p.university || "University not specified";
  $("profileBio").textContent = p.bio || "Add a friendly professional bio so other students can get to know you.";
  $("profileEmail").textContent = p.email || state.user?.email || "—";
  $("profileDepartment").textContent = p.department || "—";
  $("profileMobile").textContent = p.mobile || p.contact_info || "—";
  $("profilePortfolio").innerHTML = p.portfolio_url
    ? `<a style="color:var(--accent);" href="${safe(p.portfolio_url)}" target="_blank" rel="noopener">${safe(p.portfolio_url)} ↗</a>`
    : "—";
  $("profileCV").innerHTML = p.cv_url
    ? `<a style="color:var(--primary-teal);" href="${safe(p.cv_url)}" target="_blank" rel="noopener">View / Download CV ↗</a>`
    : "—";
  $("profileSkills").textContent = p.skills || "—";
  
  setAvatar($("profileAvatar"), p.avatar_url, nm);
  setAvatar($("profileAvatarMini"), p.avatar_url, nm);

  // Sync inputs
  if ($("pfName")) $("pfName").value = p.full_name || "";
  if ($("pfUniversity")) $("pfUniversity").value = p.university || "";
  if ($("pfDepartment")) $("pfDepartment").value = p.department || "";
  if ($("pfMobile")) $("pfMobile").value = p.mobile || p.contact_info || "";
  if ($("pfPortfolio")) $("pfPortfolio").value = p.portfolio_url || "";
  if ($("pfSkills")) $("pfSkills").value = p.skills || "";
  if ($("pfBio")) $("pfBio").value = p.bio || "";
  
  renderProfileListings();
}

function renderProfileListings() {
  if (!$("profileListings")) return;
  const email = (state.user?.email || "").toLowerCase();
  const name = (state.profile?.full_name || "").toLowerCase();
  
  let mine = state.listings.filter(x => x.provider_id && x.provider_id === state.user?.id);
  if (!mine.length) mine = state.listings.filter(x => name && x.student_name?.toLowerCase() === name);
  if (!mine.length && email) mine = state.listings.filter(x => x.contact_info?.toLowerCase().includes(email));

  $("profileListings").innerHTML = mine.length
    ? mine.map(x => `
      <div style="padding:14px; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md); margin-top:10px;">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
          <div>
            <b>${safe(x.title)}</b>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-top:3px;">${safe(x.category)}</div>
          </div>
          <div style="text-align:right;">
            <span class="tabular-nums" style="font-weight:800; color:var(--primary-teal);">${safe(x.price)}</span>
            <div style="margin-top:6px;">
              <button data-delete-skill="${safe(x.id)}" class="delete-skill-btn" type="button">Delete</button>
            </div>
          </div>
        </div>
      </div>
    `).join("")
    : '<div class="empty-state">You have not published any skill listings yet.</div>';

  document.querySelectorAll("[data-delete-skill]").forEach(b => {
    b.onclick = () => deleteSkill(b.dataset.deleteSkill);
  });
}

async function deleteSkill(id) {
  if (!state.user) return;
  const item = state.listings.find(x => String(x.id) === String(id));
  if (!item) return;
  
  if (sb) {
    if (item.provider_id !== state.user.id) {
      await claimLegacyListings();
      const refreshed = state.listings.find(x => String(x.id) === String(id));
      if (!refreshed || refreshed.provider_id !== state.user.id) {
        showToast("CampusX could not verify that this listing belongs to your account.", "error");
        return;
      }
    }
    const { error } = await sb.from("skill_listings").delete().eq("id", id).eq("provider_id", state.user.id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
  }
  
  state.listings = state.listings.filter(x => String(x.id) !== String(id));
  renderListings();
  renderProfileListings();
  showToast("Listing removed successfully.", "success");
}

function setWorkspace(mode) {
  state.workspace = mode;
  const isProvider = mode === "provider";
  const isClient = mode === "client";
  const isHires = mode === "hires";

  if ($("providerWorkspace")) $("providerWorkspace").classList.toggle("hidden", !isProvider);
  if ($("clientWorkspace")) $("clientWorkspace").classList.toggle("hidden", !isClient);
  if ($("profileHiresWorkspace")) $("profileHiresWorkspace").classList.toggle("hidden", !isHires);

  if ($("providerTab")) $("providerTab").classList.toggle("active", isProvider);
  if ($("clientTab")) $("clientTab").classList.toggle("active", isClient);
  if ($("profileHiresNavTab")) $("profileHiresNavTab").classList.toggle("active", isHires);
  if ($("findMode")) $("findMode").classList.toggle("active", !isProvider && !isHires);
}

async function showProfile(mode = "provider") {
  if (!requireLogin("Log in to open your student profile & workspace.")) return;
  $("feedPage").classList.add("hidden");
  $("providerPage").classList.add("hidden");
  $("profilePage").classList.remove("hidden");
  
  // Sync bottom nav
  updateBottomNav("profile");
  
  setWorkspace(mode);
  window.scrollTo({ top: 0, behavior: "smooth" });
  await loadProfile();
  await loadHires();
  await loadInboxSummary();
}

function showFeed() {
  $("providerPage").classList.add("hidden");
  $("profilePage").classList.add("hidden");
  $("feedPage").classList.remove("hidden");
  $("findMode").classList.add("active");
  $("offerMode").classList.remove("active");
  
  // Sync bottom nav
  updateBottomNav("marketplace");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateBottomNav(tab) {
  state.activeTab = tab;
  $("bottomNavMarketplace")?.classList.toggle("active", tab === "marketplace");
  $("bottomNavHires")?.classList.toggle("active", tab === "hires");
  $("bottomNavMessages")?.classList.toggle("active", tab === "messages");
  $("bottomNavProfile")?.classList.toggle("active", tab === "profile");
}

async function saveProfile(e) {
  e.preventDefault();
  if (!state.user) return;
  
  const payload = {
    id: state.user.id,
    full_name: $("pfName").value.trim(),
    university: $("pfUniversity").value.trim(),
    department: $("pfDepartment").value.trim(),
    contact_info: $("pfMobile").value.trim(),
    mobile: $("pfMobile").value.trim(),
    portfolio_url: $("pfPortfolio").value.trim(),
    skills: $("pfSkills").value.trim(),
    bio: $("pfBio").value.trim(),
    email: state.user.email || "",
    updated_at: new Date().toISOString()
  };

  const picture = $("pfPicture").files[0];
  const cv = $("pfCVFile").files[0];

  if (!sb) {
    if (picture) payload.avatar_url = await fileToDataURL(picture);
    if (cv) payload.cv_url = await fileToDataURL(cv);
    localStorage.setItem("campusx-demo-profile", JSON.stringify(payload));
    state.profile = { ...state.profile, ...payload };
  } else {
    if (picture) {
      const up = await uploadProfileFile(picture, "avatars");
      if (up) payload.avatar_url = up;
    }
    if (cv) {
      const up = await uploadProfileFile(cv, "cvs");
      if (up) payload.cv_url = up;
    }
    const { error } = await sb.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) {
      showToast(error.message, "error");
      return;
    }
    await sb.auth.updateUser({ data: { full_name: payload.full_name } });
    state.profile = { ...state.profile, ...payload };
  }

  renderProfile();
  closeModal("editProfileModal");
  showToast("Profile updated successfully!", "success");
}

function openListing() {
  if (!requireLogin("Log in before publishing a student skill.")) return;
  if (state.user) {
    $("studentName").value = state.profile?.full_name || profileName();
    $("uniEmail").value = state.user.email || "";
    $("contact").value = state.profile?.mobile || state.profile?.email || state.user.email || "";
  }
  openModal("listingModal");
}

// ==========================================================================
// Hires & Contracts Workflow
// ==========================================================================
async function openHire() {
  if (!requireLogin("Log in as a student to send a hire request.")) return;
  let pid = state.publicProfile?.id;
  if (sb && !isUuid(pid)) pid = await resolveCurrentProvider();
  if (state.user.id === pid) {
    showToast("You cannot hire your own profile.", "warning");
    return;
  }
  $("hireTitle").value = state.publicListing?.title || "";
  $("hireDetails").value = "";
  $("hireBudget").value = state.publicListing?.price || "";
  openModal("hireModal");
}

async function submitHire(e) {
  e.preventDefault();
  if (!requireLogin()) return;
  
  let pid = state.publicProfile?.id;
  if (sb && !isUuid(pid)) pid = await resolveCurrentProvider();
  const linked = isUuid(pid);
  
  const row = {
    provider_id: linked ? pid : null,
    client_id: state.user.id,
    listing_id: isUuid(state.publicListing?.id) ? state.publicListing.id : null,
    listing_title: state.publicListing?.title || $("hireTitle").value.trim(),
    provider_name: state.publicProfile?.full_name || state.publicListing?.student_name || "Provider",
    client_name: profileName(),
    request_title: $("hireTitle").value.trim(),
    details: $("hireDetails").value.trim(),
    budget: $("hireBudget").value.trim(),
    status: linked ? "pending" : "awaiting_provider_link",
    created_at: new Date().toISOString()
  };

  if (sb) {
    const { error } = await sb.from("hire_requests").insert(row);
    if (error) {
      showToast(error.message, "error");
      return;
    }
  } else {
    const arr = JSON.parse(localStorage.getItem(demoKey("hires")) || "[]");
    arr.unshift({ ...row, id: crypto.randomUUID(), provider_key: pid });
    localStorage.setItem(demoKey("hires"), JSON.stringify(arr));
  }

  closeModal("hireModal");
  if (linked) {
    showToast("Hire request sent! You can also chat in CampusX Messages.", "success");
    await startConversation(true);
  } else {
    showToast("Hire request saved. Provider will receive this once linked.", "info");
  }
  await loadHires();
  await checkReviewPermission();
}

async function loadHires() {
  if (!state.user) return;
  if (sb) {
    const { data, error } = await sb.from("hire_requests").select("*").or(`client_id.eq.${state.user.id},provider_id.eq.${state.user.id}`).order("created_at", { ascending: false });
    if (error) console.warn("Could not load hire requests:", error.message);
    state.hires = data || [];
  } else {
    state.hires = JSON.parse(localStorage.getItem(demoKey("hires")) || "[]");
  }

  const incoming = state.hires.filter(h => String(h.provider_id) === String(state.user?.id));
  const outgoing = state.hires.filter(h => String(h.client_id) === String(state.user?.id) || (!sb && h.client_name === profileName()));
  const pendingIncoming = incoming.filter(h => h.status === "pending").length;

  if ($("hiresCount")) $("hiresCount").textContent = incoming.length;
  if ($("profileHiresBadge")) {
    $("profileHiresBadge").textContent = incoming.length;
  }
  if ($("dropdownHiresCount")) {
    $("dropdownHiresCount").textContent = incoming.length;
    $("dropdownHiresCount").classList.toggle("hidden", incoming.length === 0);
  }
  if ($("bottomNavHiresBadge")) {
    $("bottomNavHiresBadge").textContent = pendingIncoming > 0 ? pendingIncoming : incoming.length;
    $("bottomNavHiresBadge").classList.toggle("hidden", incoming.length === 0);
  }
  if ($("hiresIncomingCount")) $("hiresIncomingCount").textContent = incoming.length;
  if ($("hiresOutgoingCount")) $("hiresOutgoingCount").textContent = outgoing.length;
  if ($("profileHiresIncomingCount")) $("profileHiresIncomingCount").textContent = incoming.length;
  if ($("profileHiresOutgoingCount")) $("profileHiresOutgoingCount").textContent = outgoing.length;

  renderHires();
  renderHiresModal();
  renderHireInbox();
  await loadNotifications();
}

function openHiresModal(tab = "incoming") {
  if (!requireLogin("Log in to view your campus hires & ongoing work.")) return;
  openModal("hiresModal");
  setHiresTab(tab);
  renderHiresModal();
}

function setHiresTab(tab) {
  const isIncoming = tab === "incoming";
  $("hiresIncomingTab")?.classList.toggle("active", isIncoming);
  $("hiresOutgoingTab")?.classList.toggle("active", !isIncoming);
  $("hiresIncomingPanel")?.classList.toggle("hidden", !isIncoming);
  $("hiresOutgoingPanel")?.classList.toggle("hidden", isIncoming);
}

function renderHiresModal() {
  const incoming = state.hires.filter(h => String(h.provider_id) === String(state.user?.id));
  const outgoing = state.hires.filter(h => String(h.client_id) === String(state.user?.id) || (!sb && h.client_name === profileName()));

  if ($("hiresIncomingCount")) $("hiresIncomingCount").textContent = incoming.length;
  if ($("hiresOutgoingCount")) $("hiresOutgoingCount").textContent = outgoing.length;
  if ($("profileHiresIncomingCount")) $("profileHiresIncomingCount").textContent = incoming.length;
  if ($("profileHiresOutgoingCount")) $("profileHiresOutgoingCount").textContent = outgoing.length;

  const incomingHtml = incoming.length
    ? incoming.map(h => `
      <div class="hire-card">
        <div class="hire-row">
          <div>
            <b>${safe(h.client_name || "Client Student")}</b>
            <div style="font-size:0.82rem; color:var(--text-muted); margin-top:2px;">${safe(h.request_title || h.listing_title || "Hire request")}</div>
          </div>
          ${statusBadge(h.status)}
        </div>
        <p style="margin-top:10px; font-size:0.88rem; color:var(--text-muted); line-height:1.5;">${safe(h.details || "No project details provided.")}</p>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:12px; padding-top:10px; border-top:1px solid var(--border-subtle); flex-wrap:wrap; gap:8px;">
          <div style="font-size:0.84rem; font-weight:700; color:var(--primary-teal);">Offer / Budget: ${safe(h.budget || "Standard rate")}</div>
          <div class="hire-actions" style="margin-top:0;">
            ${h.status === "pending" ? `
              <button data-hire-action="accepted" data-hire-id="${safe(h.id)}" class="button small primary" type="button">Accept</button>
              <button data-hire-action="declined" data-hire-id="${safe(h.id)}" class="button small ghost" type="button">Decline</button>
            ` : h.status === "accepted" ? `
              <button data-hire-action="completed" data-hire-id="${safe(h.id)}" class="button small primary" type="button">Mark Complete</button>
            ` : `
              <span style="font-size:0.8rem; color:var(--text-dim); font-weight:600;">Status: ${safe(h.status)}</span>
            `}
          </div>
        </div>
      </div>
    `).join("")
    : '<div class="empty-state">No incoming client hire requests yet.</div>';

  const outgoingHtml = outgoing.length
    ? outgoing.map(h => `
      <div class="hire-card">
        <div class="hire-row">
          <div>
            <b>${safe(h.provider_name || "Provider Student")}</b>
            <div style="font-size:0.82rem; color:var(--text-muted); margin-top:2px;">${safe(h.request_title || h.listing_title || "Hire request")}</div>
          </div>
          ${statusBadge(h.status)}
        </div>
        <p style="margin-top:10px; font-size:0.88rem; color:var(--text-muted); line-height:1.5;">${safe(h.details || "No project details provided.")}</p>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:12px; padding-top:10px; border-top:1px solid var(--border-subtle); flex-wrap:wrap; gap:8px;">
          <div style="font-size:0.84rem; font-weight:700; color:var(--primary-teal);">Offer / Budget: ${safe(h.budget || "Standard rate")}</div>
          <div>
            ${h.status === "completed" ? `
              <button data-review-hire-id="${safe(h.id)}" class="button small secondary" type="button">Leave Feedback</button>
            ` : `
              <span style="font-size:0.8rem; color:var(--text-dim); font-weight:600;">In Progress (${safe(h.status)})</span>
            `}
          </div>
        </div>
      </div>
    `).join("")
    : '<div class="empty-state">You have not hired any student yet.</div>';

  if ($("hiresIncomingList")) $("hiresIncomingList").innerHTML = incomingHtml;
  if ($("hiresOutgoingList")) $("hiresOutgoingList").innerHTML = outgoingHtml;
  if ($("profileHiresIncomingList")) $("profileHiresIncomingList").innerHTML = incomingHtml;
  if ($("profileHiresOutgoingList")) $("profileHiresOutgoingList").innerHTML = outgoingHtml;

  document.querySelectorAll("[data-hire-action]").forEach(b => {
    b.onclick = () => updateHireStatus(b.dataset.hireId, b.dataset.hireAction);
  });
  document.querySelectorAll("[data-review-hire-id]").forEach(b => {
    b.onclick = () => openReviewForHire(state.hires.find(h => String(h.id) === String(b.dataset.reviewHireId)));
  });
}

function statusBadge(s) {
  const map = {
    pending: "background:var(--warning-bg); color:var(--warning);",
    accepted: "background:rgba(99,102,241,0.1); color:var(--accent);",
    completed: "background:var(--success-bg); color:var(--success);",
    declined: "background:var(--danger-bg); color:var(--danger);",
    awaiting_provider_link: "background:var(--surface-3); color:var(--text-muted);"
  };
  return `<span style="font-size:0.75rem; font-weight:700; text-transform:uppercase; padding:3px 8px; border-radius:var(--radius-full); ${map[s] || "background:var(--surface-2);"}">${safe(s.replace(/_/g, " "))}</span>`;
}

function renderHires() {
  const incoming = state.hires.filter(h => String(h.provider_id) === String(state.user?.id));
  const outgoing = state.hires.filter(h => String(h.client_id) === String(state.user?.id) || (!sb && h.client_name === profileName()));

  $("providerHires").innerHTML = incoming.length
    ? incoming.map(h => `
      <div class="hire-card">
        <div class="hire-row">
          <div>
            <b>${safe(h.client_name || "Client student")}</b>
            <div style="font-size:0.8rem; color:var(--text-muted);">${safe(h.request_title || h.listing_title || "Hire request")}</div>
          </div>
          ${statusBadge(h.status)}
        </div>
        <p>${safe(h.details || "")}</p>
        <div style="font-size:0.8rem; color:var(--primary-teal); font-weight:700; margin-top:6px;">Offer: ${safe(h.budget || "Standard")}</div>
        ${h.status === "pending" ? `
          <div class="hire-actions">
            <button data-hire-action="accepted" data-hire-id="${safe(h.id)}" class="button small primary" type="button">Accept</button>
            <button data-hire-action="declined" data-hire-id="${safe(h.id)}" class="button small ghost" type="button">Decline</button>
          </div>
        ` : h.status === "accepted" ? `
          <button data-hire-action="completed" data-hire-id="${safe(h.id)}" class="button small primary" type="button">Mark Work Complete</button>
        ` : ""}
      </div>
    `).join("")
    : '<div class="empty-state">No incoming client hire requests yet.</div>';

  $("clientHires").innerHTML = outgoing.length
    ? outgoing.map(h => `
      <div class="hire-card">
        <div class="hire-row">
          <div>
            <b>${safe(h.provider_name || "Provider student")}</b>
            <div style="font-size:0.8rem; color:var(--text-muted);">${safe(h.request_title || h.listing_title || "Hire request")}</div>
          </div>
          ${statusBadge(h.status)}
        </div>
        <p>${safe(h.details || "")}</p>
        ${h.status === "completed" ? `
          <div style="margin-top:10px;">
            <button data-review-hire-id="${safe(h.id)}" class="button small secondary" type="button">Leave Feedback</button>
          </div>
        ` : ""}
      </div>
    `).join("")
    : '<div class="empty-state">You have not hired any student yet.</div>';

  document.querySelectorAll("[data-hire-action]").forEach(b => {
    b.onclick = () => updateHireStatus(b.dataset.hireId, b.dataset.hireAction);
  });
  
  document.querySelectorAll("[data-review-hire-id]").forEach(b => {
    b.onclick = () => openReviewForHire(state.hires.find(h => String(h.id) === String(b.dataset.reviewHireId)));
  });
}

async function updateHireStatus(id, status) {
  if (sb) {
    const { error } = await sb.from("hire_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", id).eq("provider_id", state.user.id);
    if (error) {
      showToast(error.message, "error");
      return;
    }
  } else {
    const arr = JSON.parse(localStorage.getItem(demoKey("hires")) || "[]");
    const h = arr.find(x => String(x.id) === String(id));
    if (h) h.status = status;
    localStorage.setItem(demoKey("hires"), JSON.stringify(arr));
  }
  showToast(`Work status updated to: ${status}`, "success");
  await loadHires();
}

// ==========================================================================
// Conversations & Live Campus Messages
// ==========================================================================
async function getOrCreateConversation() {
  if (!state.user) return null;
  let pid = state.publicProfile?.id;
  if (sb && !isUuid(pid)) pid = await resolveCurrentProvider();
  if (state.user.id === pid) return null;

  if (sb) {
    if (!isUuid(pid)) {
      showToast("Direct messaging will activate once this provider signs in to claim the listing.", "info");
      return null;
    }
    const { data: found } = await sb.from("conversations").select("*").eq("provider_id", pid).eq("client_id", state.user.id).limit(1).maybeSingle();
    if (found) return found;

    const payload = {
      provider_id: pid,
      client_id: state.user.id,
      listing_id: isUuid(state.publicListing?.id) ? state.publicListing.id : null,
      provider_name: state.publicProfile?.full_name || state.publicListing?.student_name || "Provider",
      client_name: profileName(),
      listing_title: state.publicListing?.title || "CampusX conversation"
    };
    const { data, error } = await sb.from("conversations").insert(payload).select().single();
    if (error) {
      showToast(error.message, "error");
      return null;
    }
    return data;
  } else {
    const key = demoKey("threads");
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    let t = arr.find(x => x.provider_key === pid);
    if (!t) {
      t = {
        id: crypto.randomUUID(),
        provider_key: pid,
        provider_id: pid,
        client_id: state.user.id,
        provider_name: state.publicProfile?.full_name || state.publicListing?.student_name || "Provider",
        client_name: profileName(),
        listing_title: state.publicListing?.title || "CampusX conversation",
        created_at: new Date().toISOString()
      };
      arr.unshift(t);
      localStorage.setItem(key, JSON.stringify(arr));
    }
    return t;
  }
}

async function startConversation(silent = false) {
  if (!requireLogin("Log in to message this student.")) return;
  const t = await getOrCreateConversation();
  if (!t) return;
  state.activeThread = t;
  if (!silent) {
    openModal("chatModal");
    await loadThreads();
    await openThread(t.id);
  }
}

async function loadInboxSummary() {
  if (!state.user) return;
  if (sb) {
    const { data } = await sb.from("conversations").select("*").or(`client_id.eq.${state.user.id},provider_id.eq.${state.user.id}`).order("updated_at", { ascending: false });
    state.threads = data || [];
  } else {
    state.threads = JSON.parse(localStorage.getItem(demoKey("threads")) || "[]");
  }
  
  if ($("inboxCount")) $("inboxCount").textContent = state.threads.length;
  renderThreadPreviews();
  await loadNotifications();
}

function renderThreadPreviews() {
  const top = state.threads.slice(0, 4);
  const html = top.length
    ? top.map(t => `
      <button data-thread-preview="${safe(t.id)}" style="display:block; width:100%; padding:12px; border:1px solid var(--border); border-radius:var(--radius-sm); margin-bottom:8px; text-align:left; background:var(--surface);">
        <b>${safe(otherName(t))}</b>
        <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">${safe(t.listing_title || "Campus message")}</div>
      </button>
    `).join("")
    : '<div class="empty-state">No conversations yet.</div>';
    
  if ($("clientThreads")) $("clientThreads").innerHTML = html;
  document.querySelectorAll("[data-thread-preview]").forEach(b => {
    b.onclick = () => {
      openInbox().then(() => openThread(b.dataset.threadPreview));
    };
  });
}

function otherName(t) {
  return t.provider_id === state.user?.id
    ? (t.client_name || "Client student")
    : (t.provider_name || "Provider student");
}

function notificationSender(m) {
  const t = state.threads.find(x => String(x.id) === String(m.conversation_id));
  return t ? otherName(t) : (m.sender_name || m.client_name || m.provider_name || "Campus student");
}

function hireNotificationKey(h) {
  return `campusx-hire-read-${state.user?.id || "guest"}-${h.id}`;
}

function isHireNotificationRead(h) {
  return localStorage.getItem(hireNotificationKey(h)) === "1";
}

function markHireNotificationRead(h) {
  if (h && h.id) localStorage.setItem(hireNotificationKey(h), "1");
}

async function loadNotifications() {
  if (!state.user) return;
  const notifications = [];
  if (sb) {
    const threadIds = state.threads.map(t => t.id).filter(Boolean);
    if (threadIds.length) {
      const { data, error } = await sb.from("messages").select("id,conversation_id,sender_id,sender_name,body,message,created_at,read_at").in("conversation_id", threadIds).neq("sender_id", state.user.id).is("read_at", null).order("created_at", { ascending: false }).limit(20);
      if (!error) (data || []).forEach(m => notifications.push({ ...m, kind: "message" }));
    }
  } else {
    for (const t of state.threads) {
      const arr = JSON.parse(localStorage.getItem(`campusx-messages-${t.id}`) || "[]");
      arr.filter(m => m.sender_id !== state.user.id && !m.read_at).forEach(m => notifications.push({ ...m, kind: "message" }));
    }
  }

  (state.hires || []).filter(h => (
    (String(h.provider_id) === String(state.user.id) && ["pending", "accepted"].includes(h.status)) ||
    (String(h.client_id) === String(state.user.id) && h.status === "completed")
  ) && !isHireNotificationRead(h)).forEach(h => notifications.push({ ...h, kind: "hire" }));

  state.notifications = notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20);
  renderNotifications();
}

function renderNotifications() {
  const list = $("notificationList");
  const count = $("notificationCount");
  const bottomBadge = $("bottomNavInboxCount");
  if (!list || !count) return;

  const n = state.notifications.length;
  count.textContent = n > 99 ? "99+" : String(n);
  count.classList.toggle("hidden", !n);
  
  if (bottomBadge) {
    bottomBadge.textContent = n > 99 ? "99+" : String(n);
    bottomBadge.classList.toggle("hidden", !n);
  }

  list.innerHTML = n
    ? state.notifications.map(m => m.kind === "hire"
      ? `<button class="notification-item" data-notif-hire="${safe(m.id)}" type="button">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="notif-name" style="color:var(--primary-teal);">◈ Hire Request Update</span>
          </div>
          <div class="notif-text">${safe(m.provider_id === state.user?.id ? `${m.client_name || "A client"} sent a hire request` : `Your requested work is ${m.status}`)}</div>
          <div class="notif-time tabular-nums">${safe(m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "")}</div>
        </button>`
      : `<button class="notification-item" data-notif-thread="${safe(m.conversation_id)}" type="button">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="notif-name">${safe(notificationSender(m))}</span>
          </div>
          <div class="notif-text">${safe(m.body || m.message || "New message")}</div>
          <div class="notif-time tabular-nums">${safe(m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "")}</div>
        </button>`
    ).join("")
    : '<div style="padding:24px; text-align:center; color:var(--text-dim); font-size:0.82rem;">You are all caught up.</div>';

  document.querySelectorAll("[data-notif-thread]").forEach(b => {
    b.onclick = async () => {
      toggleNotificationMenu(false);
      await openInbox();
      await openThread(b.dataset.notifThread);
    };
  });

  document.querySelectorAll("[data-notif-hire]").forEach(b => {
    b.onclick = async () => {
      const h = state.notifications.find(x => x.kind === "hire" && String(x.id) === String(b.dataset.notifHire));
      markHireNotificationRead(h);
      state.notifications = state.notifications.filter(x => x !== h);
      renderNotifications();
      toggleNotificationMenu(false);
      openHiresModal(String(h?.provider_id) === String(state.user?.id) ? "incoming" : "outgoing");
    };
  });
}

function toggleNotificationMenu(force) {
  const menu = $("notificationMenu");
  const btn = $("notificationBtn");
  if (!menu) return;
  const open = force === undefined ? menu.classList.contains("hidden") : !!force;
  menu.classList.toggle("hidden", !open);
  btn?.setAttribute("aria-expanded", String(open));
}

async function markThreadRead(id) {
  if (!state.user) return false;
  if (sb) {
    const { error } = await sb.rpc("mark_conversation_messages_read", { target_conversation: id });
    if (error) {
      console.warn("Could not mark conversation read:", error.message);
      return false;
    }
  } else {
    const key = `campusx-messages-${id}`;
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    arr.forEach(m => {
      if (m.sender_id !== state.user.id) m.read_at = new Date().toISOString();
    });
    localStorage.setItem(key, JSON.stringify(arr));
  }
  state.notifications = state.notifications.filter(m => String(m.conversation_id) !== String(id));
  renderNotifications();
  return true;
}

async function markAllNotificationsRead() {
  if (!state.user) return;
  if (sb) {
    const { error } = await sb.rpc("mark_all_my_messages_read");
    if (error) {
      const ids = [...new Set(state.notifications.filter(m => m.kind === "message").map(m => m.conversation_id))];
      for (const id of ids) await markThreadRead(id);
    }
  } else {
    const ids = [...new Set(state.notifications.filter(m => m.kind === "message").map(m => m.conversation_id))];
    for (const id of ids) await markThreadRead(id);
  }
  state.notifications.filter(m => m.kind === "hire").forEach(markHireNotificationRead);
  await loadNotifications();
  showToast("All notifications marked as read.", "success");
}

function subscribeNotifications() {
  if (!sb || !state.user) return;
  if (state.notificationChannel) sb.removeChannel(state.notificationChannel);
  state.notificationChannel = sb.channel(`campusx-notifications-${state.user.id}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, payload => {
      if (payload.new.sender_id !== state.user.id) loadInboxSummary();
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, () => loadNotifications())
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "hire_requests" }, payload => {
      if (String(payload.new.provider_id) === String(state.user.id) || String(payload.new.client_id) === String(state.user.id)) {
        loadHires();
        loadInboxSummary();
      }
    })
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "hire_requests" }, payload => {
      if (String(payload.new.provider_id) === String(state.user.id) || String(payload.new.client_id) === String(state.user.id)) {
        loadHires();
        loadInboxSummary();
      }
    })
    .subscribe();
}

function renderHireInbox() {
  const box = $("hireInbox");
  if (!box) return;
  const relevant = state.hires.filter(h => String(h.provider_id) === String(state.user?.id) || String(h.client_id) === String(state.user?.id));
  
  box.innerHTML = relevant.length
    ? relevant.slice(0, 6).map(h => {
      const incoming = String(h.provider_id) === String(state.user.id);
      return `
        <div class="hire-inbox-card">
          <div class="hire-inbox-top">
            <b>${safe(incoming ? h.client_name || "Client student" : h.provider_name || "Provider student")}</b>
            ${statusBadge(h.status)}
          </div>
          <div style="font-weight:700; font-size:0.85rem; margin-top:4px;">${safe(h.request_title || h.listing_title || "Hire request")}</div>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-top:4px;">${safe(h.details || "No details provided")}</div>
          <div style="font-size:0.8rem; font-weight:700; color:var(--primary-teal); margin-top:4px;">Offer: ${safe(h.budget || "Standard rate")}</div>
          ${incoming && h.status === "pending" ? `
            <div class="hire-inbox-actions">
              <button data-hire-action="accepted" data-hire-id="${safe(h.id)}" class="button small primary" type="button">Accept</button>
              <button data-hire-action="declined" data-hire-id="${safe(h.id)}" class="button small ghost" type="button">Decline</button>
            </div>
          ` : incoming && h.status === "accepted" ? `
            <button data-hire-action="completed" data-hire-id="${safe(h.id)}" class="button small primary" style="margin-top:8px;" type="button">Mark Complete</button>
          ` : h.status === "completed" && !incoming ? `
            <button data-review-hire-id="${safe(h.id)}" class="button small secondary" style="margin-top:8px;" type="button">Leave Feedback</button>
          ` : ""}
        </div>
      `;
    }).join("")
    : '<div class="empty-state">No hiring activities yet.</div>';

  box.querySelectorAll("[data-hire-action]").forEach(b => {
    b.onclick = () => updateHireStatus(b.dataset.hireId, b.dataset.hireAction);
  });
  box.querySelectorAll("[data-review-hire-id]").forEach(b => {
    b.onclick = () => openReviewForHire(state.hires.find(h => String(h.id) === String(b.dataset.reviewHireId)));
  });
}

function openReviewForHire(h) {
  if (!h || h.status !== "completed") return;
  closeModal("chatModal");
  state.reviewHire = h;
  $("reviewProviderName").textContent = h.provider_name || "this provider";
  $("reviewWorkTitle").textContent = h.request_title || h.listing_title || "Completed project";
  $("directReviewMessage").value = "";
  openModal("reviewModal");
}

async function loadThreads() {
  await loadInboxSummary();
  const previews = {};
  
  if (sb && state.threads.length) {
    const { data } = await sb.from("messages").select("conversation_id,body,created_at,sender_id").in("conversation_id", state.threads.map(t => t.id)).order("created_at", { ascending: false });
    const active = new Set((data || []).map(m => String(m.conversation_id)));
    (data || []).forEach(m => {
      if (!previews[m.conversation_id]) previews[m.conversation_id] = m;
    });
    state.threads = state.threads.filter(t => active.has(String(t.id)));
  } else if (!sb) {
    state.threads = state.threads.filter(t => {
      const messages = JSON.parse(localStorage.getItem(`campusx-messages-${t.id}`) || "[]");
      if (messages.length) previews[t.id] = messages[messages.length - 1];
      return messages.length;
    });
  }

  await loadHires();
  renderHireInbox();

  $("threadList").innerHTML = state.threads.length
    ? state.threads.map(t => {
      const name = otherName(t);
      const last = previews[t.id];
      const preview = last?.body || "Start a conversation";
      const timeStr = last?.created_at
        ? new Date(last.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : "";
      return `
        <button data-thread-id="${safe(t.id)}" class="thread-item ${state.activeThread?.id === t.id ? "active" : ""}" type="button">
          <span class="thread-avatar">${safe(initials(name))}</span>
          <span class="thread-copy">
            <span class="thread-topline">
              <b>${safe(name)}</b>
              <time class="tabular-nums">${safe(timeStr)}</time>
            </span>
            <span class="thread-preview">${safe(preview)}</span>
            <span class="thread-context">${safe(t.listing_title || "Campus conversation")}</span>
          </span>
        </button>
      `;
    }).join("")
    : '<div style="padding:32px 16px; text-align:center; color:var(--text-dim); font-size:0.85rem;">No messages yet.<br>Start a chat from a student profile.</div>';

  document.querySelectorAll("[data-thread-id]").forEach(b => {
    b.onclick = () => openThread(b.dataset.threadId);
  });
}

async function openInbox() {
  if (!requireLogin("Log in to open messages.")) return;
  toggleNotificationMenu(false);
  openModal("chatModal");
  
  // Sync bottom nav
  updateBottomNav("messages");

  const mobile = window.matchMedia("(max-width: 768px)").matches;
  if (mobile) {
    setInboxTab("messages");
    $("chatModal").classList.add("show-threads");
  }
  
  await loadThreads();
  if (!mobile && (state.activeThread || state.threads[0])) {
    await openThread((state.activeThread || state.threads[0]).id);
  }
}

async function openThread(id) {
  const t = state.threads.find(x => String(x.id) === String(id)) || state.activeThread;
  if (!t) return;
  state.activeThread = t;
  
  $("chatHeader").textContent = `${otherName(t)} • ${t.listing_title || "CampusX"}`;
  $("chatModal").classList.remove("show-threads");
  $("messageForm").classList.remove("hidden");

  if (sb) {
    const { data } = await sb.from("messages").select("*").eq("conversation_id", t.id).order("created_at", { ascending: true });
    state.messages = data || [];
  } else {
    state.messages = JSON.parse(localStorage.getItem(`campusx-messages-${t.id}`) || "[]");
  }

  renderMessages();
  await markThreadRead(t.id);
  await loadThreads();
  subscribeMessages(t.id);
}

function renderMessages() {
  $("messageList").innerHTML = state.messages.length
    ? state.messages.map(m => `
      <div class="message-bubble ${m.sender_id === state.user?.id ? "mine" : ""}">
        ${m.sender_id === state.user?.id ? `
          <div class="message-actions">
            <button class="delete-message-btn" data-delete-message="${safe(m.id)}" type="button" title="Delete message">×</button>
          </div>
        ` : ""}
        <div>${safe(m.body || m.message || "")}</div>
        <div class="message-sender">${safe(m.sender_name || notificationSender(m) || "Student")}</div>
      </div>
    `).join("")
    : '<div style="display:grid; place-items:center; height:100%; color:var(--text-dim); font-size:0.88rem;">Start the conversation...</div>';

  document.querySelectorAll("[data-delete-message]").forEach(b => {
    b.onclick = () => deleteMessage(b.dataset.deleteMessage);
  });
  
  $("messageList").scrollTop = $("messageList").scrollHeight;
}

async function deleteMessage(id) {
  const m = state.messages.find(x => String(x.id) === String(id));
  if (!m || String(m.sender_id) !== String(state.user?.id)) return;
  
  if (sb) {
    let deleted = false;
    try {
      const { data, error } = await sb.rpc("delete_own_message", { target_message: String(id) });
      if (error) throw error;
      deleted = !!data;
    } catch (err) {
      showToast(`Could not delete message: ${err.message || err}`, "error");
      return;
    }
    if (!deleted) {
      showToast("Message was not deleted from database.", "warning");
      await openThread(state.activeThread.id);
      return;
    }
  } else {
    const key = `campusx-messages-${state.activeThread.id}`;
    state.messages = state.messages.filter(x => String(x.id) !== String(id));
    localStorage.setItem(key, JSON.stringify(state.messages));
  }

  state.messages = state.messages.filter(x => String(x.id) !== String(id));
  renderMessages();
  await loadNotifications();
  showToast("Message deleted.", "info");
}

function subscribeMessages(conversationId) {
  if (!sb) return;
  if (state.messageChannel) sb.removeChannel(state.messageChannel);
  state.messageChannel = sb.channel(`messages-${conversationId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, payload => {
      if (!state.messages.some(m => m.id === payload.new.id)) {
        state.messages.push(payload.new);
        renderMessages();
        if (payload.new.sender_id !== state.user?.id) markThreadRead(conversationId);
      }
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, payload => {
      state.messages = state.messages.filter(m => String(m.id) !== String(payload.old.id));
      renderMessages();
    })
    .subscribe();
}

async function sendMessage(e) {
  e.preventDefault();
  const body = $("messageInput").value.trim();
  if (!body || !state.activeThread) return;

  const row = {
    conversation_id: state.activeThread.id,
    sender_id: state.user.id,
    sender_name: profileName(),
    body,
    message: body,
    created_at: new Date().toISOString()
  };

  if (sb) {
    const { data, error } = await sb.from("messages").insert(row).select().single();
    if (error) {
      showToast(error.message, "error");
      return;
    }
    if (!state.messages.some(m => m.id === data.id)) state.messages.push(data);
    await sb.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", state.activeThread.id);
  } else {
    row.id = crypto.randomUUID();
    state.messages.push(row);
    localStorage.setItem(`campusx-messages-${state.activeThread.id}`, JSON.stringify(state.messages));
  }

  $("messageInput").value = "";
  renderMessages();
}

function setInboxTab(tab) {
  const messages = tab === "messages";
  $("messagesTab")?.classList.toggle("active", messages);
  $("hiringTab")?.classList.toggle("active", !messages);
  $("messageInboxPanel")?.classList.toggle("hidden", !messages);
  $("hiringInboxPanel")?.classList.toggle("hidden", messages);
}

// ==========================================================================
// Initialization & Event Binding
// ==========================================================================
initTheme();
showFeed();
setInboxTab("messages");

// Populate Categories
$("category").innerHTML = CATEGORIES.slice(1).map(c => `<option>${safe(c)}</option>`).join("");
renderFilters();
loadListings();

// Sort Filter Listener
if ($("sortFilter")) {
  $("sortFilter").onchange = e => {
    state.sort = e.target.value;
    renderListings();
  };
}

// Theme Toggles
if ($("themeToggle")) $("themeToggle").onclick = () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
if ($("authThemeToggle")) $("authThemeToggle").onclick = () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");

// Navigation & Auth Triggers
$("login").onclick = () => {
  setAuthMode(false);
  $("authMsg").textContent = "";
  openModal("authModal");
};
$("signup").onclick = () => {
  setAuthMode(true);
  $("authMsg").textContent = "";
  openModal("authModal");
};
$("loginTab").onclick = () => setAuthMode(false);
$("signupTab").onclick = () => setAuthMode(true);

// 1-Click Demo Guest Login Trigger
if ($("demoLoginBtn")) {
  $("demoLoginBtn").onclick = async () => {
    const guestUser = {
      id: "demo-student-user",
      email: "guest.student@campus.edu",
      user_metadata: { full_name: "Farhan Ahmed (Guest)" }
    };
    updateUser(guestUser);
    closeModal("authModal");
    await loadProfile();
  };
}

$("authForm").onsubmit = async e => {
  e.preventDefault();
  $("authMsg").textContent = "";
  
  if (!sb) {
    const fake = {
      id: "demo-user",
      email: $("email").value,
      user_metadata: { full_name: $("name").value || "Student User" }
    };
    updateUser(fake);
    closeModal("authModal");
    await loadProfile();
    return;
  }

  const result = state.signupMode
    ? await sb.auth.signUp({
        email: $("email").value,
        password: $("password").value,
        options: {
          data: { full_name: $("name").value.trim() },
          emailRedirectTo: window.location.origin
        }
      })
    : await sb.auth.signInWithPassword({
        email: $("email").value,
        password: $("password").value
      });

  if (result.error) {
    $("authMsg").textContent = result.error.message;
    return;
  }

  if (state.signupMode && !result.data.session) {
    $("authMsg").textContent = "Account created. Please verify your email, then log in.";
    return;
  }

  updateUser(result.data.user);
  closeModal("authModal");
  await loadProfile();
};

$("logout").onclick = async () => {
  if (sb) await sb.auth.signOut();
  updateUser(null);
  showFeed();
  showToast("Logged out successfully.", "info");
};

["post", "postTop", "profilePostBtn"].forEach(id => {
  if ($(id)) $(id).onclick = openListing;
});

$("listingForm").onsubmit = async e => {
  e.preventDefault();
  if (!requireLogin()) return;

  const payload = {
    title: $("title").value.trim(),
    category: $("category").value,
    description: $("description").value.trim(),
    price: $("price").value.trim(),
    student_name: $("studentName").value.trim(),
    contact_info: $("contact").value.trim(),
    provider_id: state.user.id
  };

  if (sb && state.user.email?.toLowerCase() !== $("uniEmail").value.trim().toLowerCase()) {
    showToast("Email must match your active account email.", "warning");
    return;
  }

  if (sb) {
    const { data, error } = await sb.from("skill_listings").insert(payload).select().single();
    if (error) {
      showToast(error.message, "error");
      return;
    }
    state.listings.unshift(data);
  } else {
    state.listings.unshift({
      ...payload,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    });
  }

  e.target.reset();
  closeModal("listingModal");
  renderListings();
  showToast("Skill listing published successfully!", "success");
  showProfile("provider");
};

// Search handling
function doSearch(v) {
  state.query = v.toLowerCase();
  if ($("search") && $("search").value !== v) $("search").value = v;
  if ($("searchMobile") && $("searchMobile").value !== v) $("searchMobile").value = v;
  renderListings();
}

if ($("search")) $("search").oninput = e => doSearch(e.target.value);
if ($("searchMobile")) $("searchMobile").oninput = e => doSearch(e.target.value);
if ($("browseBtn")) $("browseBtn").onclick = () => $("marketplace").scrollIntoView({ behavior: "smooth" });

// Navigation View Links
if ($("profileBtn")) $("profileBtn").onclick = () => showProfile("provider");
if ($("homeBtn")) $("homeBtn").onclick = showFeed;
if ($("backToFeed")) $("backToFeed").onclick = showFeed;
if ($("backFromProvider")) $("backFromProvider").onclick = showFeed;
if ($("offerMode")) $("offerMode").onclick = () => showProfile("provider");
if ($("findMode")) $("findMode").onclick = showFeed;
if ($("postTopNav")) $("postTopNav").onclick = openListing;

// Profile Navigation Tabs
if ($("profileInfoTab")) $("profileInfoTab").onclick = () => setWorkspace("provider");
if ($("profileHiresNavTab")) $("profileHiresNavTab").onclick = () => setWorkspace("hires");
if ($("providerTab")) $("providerTab").onclick = () => setWorkspace("provider");
if ($("clientTab")) $("clientTab").onclick = () => setWorkspace("client");

if ($("editProfileBtn")) $("editProfileBtn").onclick = () => openModal("editProfileModal");
if ($("profileEditTop")) $("profileEditTop").onclick = () => openModal("editProfileModal");
if ($("providerStudioEdit")) $("providerStudioEdit").onclick = () => openModal("editProfileModal");
if ($("profileLogoutBtn")) $("profileLogoutBtn").onclick = () => $("logout").click();
if ($("profileForm")) $("profileForm").onsubmit = saveProfile;

// Profile Hires Segmented Tabs
if ($("profileHiresIncomingTab")) {
  $("profileHiresIncomingTab").onclick = () => {
    $("profileHiresIncomingTab").classList.add("active");
    $("profileHiresOutgoingTab")?.classList.remove("active");
    $("profileHiresIncomingPanel")?.classList.remove("hidden");
    $("profileHiresOutgoingPanel")?.classList.add("hidden");
  };
}
if ($("profileHiresOutgoingTab")) {
  $("profileHiresOutgoingTab").onclick = () => {
    $("profileHiresOutgoingTab").classList.add("active");
    $("profileHiresIncomingTab")?.classList.remove("active");
    $("profileHiresOutgoingPanel")?.classList.remove("hidden");
    $("profileHiresIncomingPanel")?.classList.add("hidden");
  };
}

// User Dropdown Menu Controls
function toggleUserMenu(force) {
  const menu = $("userDropdownMenu");
  const btn = $("userMenuBtn");
  if (!menu) return;
  const show = force !== undefined ? force : menu.classList.contains("hidden");
  menu.classList.toggle("hidden", !show);
  btn?.setAttribute("aria-expanded", String(show));
}

function closeUserMenu() {
  toggleUserMenu(false);
}

if ($("userMenuBtn")) {
  $("userMenuBtn").onclick = e => {
    e.stopPropagation();
    toggleUserMenu();
  };
}

if ($("dropdownProfileBtn")) {
  $("dropdownProfileBtn").onclick = () => {
    closeUserMenu();
    showProfile("provider");
  };
}

if ($("dropdownHiresBtn")) {
  $("dropdownHiresBtn").onclick = () => {
    closeUserMenu();
    showProfile("hires");
  };
}

if ($("dropdownStudioBtn")) {
  $("dropdownStudioBtn").onclick = () => {
    closeUserMenu();
    showProfile("provider");
  };
}

if ($("dropdownAddSkillBtn")) {
  $("dropdownAddSkillBtn").onclick = () => {
    closeUserMenu();
    openListing();
  };
}

document.addEventListener("click", e => {
  if (!$("userMenuWrap")?.contains(e.target)) closeUserMenu();
});

// Interactions
if ($("hireProviderBtn")) $("hireProviderBtn").onclick = openHire;
if ($("messageProviderBtn")) $("messageProviderBtn").onclick = () => startConversation(false);
if ($("hireForm")) $("hireForm").onsubmit = submitHire;
if ($("messageForm")) $("messageForm").onsubmit = sendMessage;

// Top Bar Individual Buttons
if ($("hiresBtn")) $("hiresBtn").onclick = () => openHiresModal();
if ($("inboxBtn")) $("inboxBtn").onclick = openInbox;

document.querySelectorAll("[data-open-inbox]").forEach(b => b.onclick = openInbox);

// Notifications Popover
if ($("notificationBtn")) {
  $("notificationBtn").onclick = e => {
    e.stopPropagation();
    toggleNotificationMenu();
  };
}
if ($("notificationOpenHires")) {
  $("notificationOpenHires").onclick = () => {
    toggleNotificationMenu(false);
    showProfile("hires");
  };
}
if ($("notificationOpenInbox")) $("notificationOpenInbox").onclick = openInbox;
if ($("markAllReadBtn")) $("markAllReadBtn").onclick = markAllNotificationsRead;

document.addEventListener("click", e => {
  if (!$("notificationWrap")?.contains(e.target)) toggleNotificationMenu(false);
});

// Mobile Hamburger Menu
if ($("mobileMenuBtn")) {
  $("mobileMenuBtn").onclick = e => {
    e.stopPropagation();
    const menu = $("mobileMenu");
    const open = menu.classList.contains("hidden");
    menu.classList.toggle("hidden", !open);
    $("mobileMenuBtn").setAttribute("aria-expanded", String(open));
  };
}
if ($("mobileMenuHome")) $("mobileMenuHome").onclick = () => { closeMobileMenu(); showFeed(); };
if ($("mobileMenuHires")) $("mobileMenuHires").onclick = () => { closeMobileMenu(); openHiresModal(); };
if ($("mobileMenuMessages")) $("mobileMenuMessages").onclick = () => { closeMobileMenu(); openInbox(); };
if ($("mobileMenuProfile")) $("mobileMenuProfile").onclick = () => { closeMobileMenu(); showProfile("provider"); };
if ($("mobileMenuLogout")) $("mobileMenuLogout").onclick = () => { closeMobileMenu(); $("logout").click(); };

document.addEventListener("click", e => {
  if (!$("mobileMenu")?.contains(e.target) && e.target !== $("mobileMenuBtn")) closeMobileMenu();
});

function closeMobileMenu() {
  const menu = $("mobileMenu");
  if (menu) {
    menu.classList.add("hidden");
    $("mobileMenuBtn")?.setAttribute("aria-expanded", "false");
  }
}

// Mobile Bottom App Navigation Bar
if ($("bottomNavMarketplace")) {
  $("bottomNavMarketplace").onclick = () => showFeed();
}
if ($("bottomNavHires")) {
  $("bottomNavHires").onclick = () => openHiresModal();
}
if ($("bottomNavMessages")) {
  $("bottomNavMessages").onclick = () => openInbox();
}
if ($("bottomNavProfile")) {
  $("bottomNavProfile").onclick = () => showProfile("provider");
}

// Dedicated Hires Tabs
if ($("hiresIncomingTab")) $("hiresIncomingTab").onclick = () => setHiresTab("incoming");
if ($("hiresOutgoingTab")) $("hiresOutgoingTab").onclick = () => setHiresTab("outgoing");

// Chat Mobile Controls
if ($("chatThreadsBtn")) {
  $("chatThreadsBtn").onclick = () => {
    $("chatModal").classList.add("show-threads");
  };
}
if ($("chatProfileBtn")) {
  $("chatProfileBtn").onclick = () => {
    if (state.activeThread?.provider_id && String(state.activeThread.provider_id) !== String(state.user?.id)) {
      const item = state.listings.find(x => String(x.provider_id) === String(state.activeThread.provider_id));
      if (item) openProvider(item);
    }
  };
}

// Reviews Forms
if ($("reviewForm")) {
  $("reviewForm").onsubmit = async e => {
    e.preventDefault();
    if (!state.canReview) {
      showToast("Review unlocks after work is marked complete.", "warning");
      return;
    }
    const rating = Number($("reviewRating").value);
    const message = $("reviewMessage").value.trim();
    const p = state.publicProfile || {};
    const row = {
      rating,
      message,
      reviewer_name: profileName(),
      created_at: new Date().toISOString()
    };

    if (sb && isUuid(p.id)) {
      const { error } = await sb.from("profile_reviews").insert({
        profile_id: p.id,
        reviewer_id: state.user.id,
        reviewer_name: profileName(),
        rating,
        message
      });
      if (error) {
        showToast(error.message, "error");
        return;
      }
    } else {
      const key = p.id || state.publicListing?.student_name;
      const arr = JSON.parse(localStorage.getItem(`campusx-reviews-${key}`) || "[]");
      arr.unshift(row);
      localStorage.setItem(`campusx-reviews-${key}`, JSON.stringify(arr));
    }

    $("reviewMessage").value = "";
    state.canReview = false;
    await loadReviews();
    updateReviewUI("Thanks — your feedback was published!");
    showToast("Review submitted!", "success");
  };
}

if ($("directReviewForm")) {
  $("directReviewForm").onsubmit = async e => {
    e.preventDefault();
    const h = state.reviewHire;
    if (!h || h.status !== "completed") return;

    const rating = Number($("directReviewRating").value);
    const message = $("directReviewMessage").value.trim();
    if (!message) return;

    const row = {
      rating,
      message,
      reviewer_name: profileName(),
      created_at: new Date().toISOString()
    };

    if (sb && isUuid(h.provider_id)) {
      const { error } = await sb.from("profile_reviews").insert({
        profile_id: h.provider_id,
        reviewer_id: state.user.id,
        reviewer_name: profileName(),
        rating,
        message
      });
      if (error) {
        showToast(`Could not submit feedback: ${error.message}`, "error");
        return;
      }
    } else {
      const key = h.provider_id || h.provider_name;
      const arr = JSON.parse(localStorage.getItem(`campusx-reviews-${key}`) || "[]");
      arr.unshift(row);
      localStorage.setItem(`campusx-reviews-${key}`, JSON.stringify(arr));
    }

    closeModal("reviewModal");
    await loadHires();
    showToast("Thanks! Your client feedback was posted.", "success");
  };
}

// Close Triggers
document.querySelectorAll("[data-close]").forEach(b => {
  b.onclick = () => {
    closeModal("authModal");
    closeModal("listingModal");
  };
});
document.querySelectorAll("[data-close-profile]").forEach(b => b.onclick = () => closeModal("editProfileModal"));
document.querySelectorAll("[data-close-hire]").forEach(b => b.onclick = () => closeModal("hireModal"));
document.querySelectorAll("[data-close-hires]").forEach(b => b.onclick = () => closeModal("hiresModal"));
document.querySelectorAll("[data-close-review]").forEach(b => b.onclick = () => closeModal("reviewModal"));
document.querySelectorAll("[data-close-chat]").forEach(b => b.onclick = () => closeModal("chatModal"));
document.querySelectorAll("[data-page-close]").forEach(b => b.onclick = showFeed);

document.querySelectorAll(".modal-backdrop").forEach(b => {
  b.onclick = () => {
    ["authModal", "listingModal", "editProfileModal", "hireModal", "hiresModal", "reviewModal", "chatModal"].forEach(closeModal);
  };
});

// Keyboard support: Close modals & menus with ESC, focus search with /
document.addEventListener("keydown", e => {
  if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
    e.preventDefault();
    $("search")?.focus();
  }
  if (e.key === "Escape") {
    closeUserMenu();
    closeMobileMenu();
    ["authModal", "listingModal", "editProfileModal", "hireModal", "hiresModal", "reviewModal", "chatModal"].forEach(closeModal);
  }
});

// Supabase Auth Listener
if (sb) {
  sb.auth.getSession().then(async ({ data }) => {
    updateUser(data.session?.user || null);
    if (data.session?.user) await loadProfile();
  });
  sb.auth.onAuthStateChange(async (_, session) => {
    updateUser(session?.user || null);
    if (session?.user) await loadProfile();
  });
}
