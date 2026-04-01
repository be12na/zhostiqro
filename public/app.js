const STORAGE_KEYS = {
  USERNAME: 'iqro_app_username'
};

const APP_STATE = {
  config: {},
  categories: [],
  selectedCategory: null,
  selectedMaterialId: null,
  selectedSurah: null,
  dzikirType: '',
  username: '',
  completedMaterialMap: {},
  progressItems: [],
  profileSaving: false,
  profileFeedback: null
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('yearNow').textContent = String(new Date().getFullYear());
  bindEvents();
  initApp();
});

function bindEvents() {
  const topNav = document.getElementById('topNav');
  const appMain = document.getElementById('appMain');

  topNav.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    handleAction(target);
  });

  appMain.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    handleAction(target);
  });

  appMain.addEventListener('keydown', (event) => {
    const target = event.target;
    if (!target || target.id !== 'usernameInput') return;
    if (event.key !== 'Enter') return;

    event.preventDefault();
    saveUsernameProfile();
  });
}

function handleAction(target) {
  const action = target.getAttribute('data-action');

  if (action === 'go-home') {
    renderHome();
    return;
  }
  if (action === 'open-doa') {
    loadDailyPrayers();
    return;
  }
  if (action === 'open-zikir') {
    loadDzikir(target.getAttribute('data-type') || '');
    return;
  }
  if (action === 'open-quran') {
    loadQuranSurahs();
    return;
  }
  if (action === 'open-category') {
    loadMaterialsByCategory(
      target.getAttribute('data-category-id') || '',
      target.getAttribute('data-category-name') || ''
    );
    return;
  }
  if (action === 'open-material') {
    const categoryId = target.getAttribute('data-category-id') || '';
    const categoryName = target.getAttribute('data-category-name') || '';
    if (categoryId) {
      APP_STATE.selectedCategory = { id: categoryId, name: categoryName || getCategoryNameById(categoryId) };
    }
    loadMaterialDetail(target.getAttribute('data-material-id') || '');
    return;
  }
  if (action === 'open-surah') {
    loadQuranVerses(
      target.getAttribute('data-surah-id') || '',
      target.getAttribute('data-surah-name') || ''
    );
    return;
  }
  if (action === 'back-materials') {
    loadMaterialsByCategory(
      target.getAttribute('data-category-id') || '',
      target.getAttribute('data-category-name') || ''
    );
    return;
  }
  if (action === 'save-username') {
    saveUsernameProfile();
    return;
  }
  if (action === 'search-materials') {
    runMaterialSearch();
    return;
  }
  if (action === 'reset-search') {
    renderHome();
    return;
  }
  if (action === 'mark-material-complete') {
    markMaterialAsCompleted(
      target.getAttribute('data-material-id') || '',
      target.getAttribute('data-material-title') || '',
      target.getAttribute('data-category-id') || '',
      target.getAttribute('data-category-name') || ''
    );
  }
}

async function callApi(endpoint, params = {}) {
  const url = new URL(`/api/${endpoint}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  const payload = await response.json();
  if (!response.ok && !(payload && payload.message)) {
    throw new Error(`Request gagal (${response.status})`);
  }
  return payload;
}

async function apiGetAppConfig() {
  return callApi('getAppConfig');
}

async function apiGetCategories() {
  return callApi('getCategories');
}

async function apiGetMaterialsByCategory(categoryId) {
  return callApi('getMaterialsByCategory', { categoryId });
}

async function apiGetMaterialById(materialId) {
  return callApi('getMaterialById', { materialId });
}

async function apiSearchMaterials(searchTitle, categoryId) {
  return callApi('searchMaterials', { searchTitle, categoryId });
}

async function apiGetLearningProgress(username) {
  return callApi('getLearningProgress', { username });
}

async function apiSaveLearningProgress(payload) {
  return callApi('saveLearningProgress', {
    username: payload.username,
    materialId: payload.materialId,
    materialTitle: payload.materialTitle,
    categoryId: payload.categoryId,
    categoryName: payload.categoryName
  });
}

async function initApp() {
  showLoading('Memuat beranda...');

  try {
    const [configResponse, categoriesResponse] = await Promise.all([apiGetAppConfig(), apiGetCategories()]);

    if (configResponse.success) APP_STATE.config = configResponse.data || {};
    if (categoriesResponse.success) APP_STATE.categories = categoriesResponse.data || [];

    APP_STATE.username = loadStoredUsername();
    if (APP_STATE.username) {
      await syncProgressForCurrentUser({ silent: true });
    }

    renderHeaderFromConfig();
    renderHome();
  } catch (error) {
    showError(`Gagal memuat data awal: ${error.message}`);
  }
}

function renderHeaderFromConfig() {
  const title = APP_STATE.config.app_name || 'Aplikasi Buku Iqro 1-6 Lengkap';
  const description =
    APP_STATE.config.app_description || 'Belajar mengaji dengan materi terstruktur dan mudah dipahami.';

  document.getElementById('appTitle').textContent = title;
  document.getElementById('appDescription').textContent = description;
}

function showLoading(message) {
  setMain(`<section class="card"><p>${escapeHtml(message || 'Memuat...')}</p></section>`);
}

function showError(message) {
  setMain(
    `<section class="card"><p><strong>Terjadi kesalahan.</strong></p><p class="muted">${escapeHtml(
      message || 'Tidak diketahui'
    )}</p></section>`
  );
}

function setMain(html) {
  document.getElementById('appMain').innerHTML = html;
}

function renderHome() {
  APP_STATE.selectedCategory = null;
  APP_STATE.selectedMaterialId = null;
  APP_STATE.selectedSurah = null;

  const completedCount = Object.keys(APP_STATE.completedMaterialMap).length;
  const totalCategories = APP_STATE.categories.length;
  const firstCategory = totalCategories ? APP_STATE.categories[0] : null;

  let html = '';
  html += '<section class="card hero-card hero-iqro">';
  html += '<div class="hero-grid">';
  html += '<div>';
  html += '<span class="hero-badge">🌙 Belajar Iqro Bertahap</span>';
  html += '<h2>Temani Anak Belajar Membaca Iqro dengan Cara Hangat & Terarah</h2>';
  html +=
    '<p class="muted">Mulai dari huruf hijaiyah, latihan baca per level, hingga pantauan progres harian. Dirancang agar anak, orang tua, dan pendamping belajar bisa maju bersama dengan ritme yang nyaman.</p>';
  html += '<div class="hero-actions">';
  if (firstCategory) {
    const firstCategoryId = escapeAttr(String(firstCategory.category_id || ''));
    const firstCategoryName = escapeAttr(String(firstCategory.category_name || ''));
    html += `<button type="button" class="btn btn-primary" data-action="open-category" data-category-id="${firstCategoryId}" data-category-name="${firstCategoryName}">Mulai Belajar Sekarang</button>`;
  } else {
    html += '<button type="button" class="btn btn-primary" data-action="open-quran">Jelajahi Materi</button>';
  }
  html += '<button type="button" class="btn" data-action="open-doa">Buka Doa Harian</button>';
  html += '</div>';
  html += '<div class="hero-highlight-list">';
  html += `<span class="status-pill">Kategori aktif: <strong>${escapeHtml(String(totalCategories))}</strong> level</span>`;
  html += `<span class="status-pill">Progres selesai: <strong>${escapeHtml(String(completedCount))}</strong> materi</span>`;
  html += '</div>';
  html += '</div>';
  html += '<aside class="hero-illustration" aria-hidden="true">';
  html += '<div class="hero-illustration-card">';
  html += '<p class="hero-illustration-title">Rencana Belajar Hari Ini</p>';
  html += '<div class="hero-highlight">📘 Iqro Dasar</div>';
  html += '<div class="hero-highlight">🔁 Latihan Bacaan Pendek</div>';
  html += '<div class="hero-highlight">✅ Tandai Materi Selesai</div>';
  html += '</div>';
  html += '</aside>';
  html += '</div>';
  html += '</section>';

  html += '<section class="home-info-grid">';
  html += '<article class="card info-card">';
  html += '<h3>Belajar Sesuai Tahap Anak</h3>';
  html +=
    '<p class="muted">Materi dipisah per level agar anak tidak terburu-buru dan tetap percaya diri di setiap kemajuan kecil.</p>';
  html += '</article>';
  html += '<article class="card info-card">';
  html += '<h3>Pendampingan Orang Tua Lebih Mudah</h3>';
  html +=
    '<p class="muted">Orang tua bisa melihat progres, memilih materi berikutnya, dan mengulang latihan kapan pun dibutuhkan.</p>';
  html += '</article>';
  html += '<article class="card info-card">';
  html += '<h3>Ramah untuk Belajar Harian</h3>';
  html +=
    '<p class="muted">Antarmuka sederhana, tombol jelas, dan alur belajar ringkas membuat sesi mengaji terasa ringan dan konsisten.</p>';
  html += '</article>';
  html += '</section>';

  html += '<section class="card profile-box">';
  html += '<h3>Profil Belajar (Tanpa Login)</h3>';
  html += '<p class="muted">Simpan nama belajar agar progres anak tetap tercatat dan mudah dilanjutkan.</p>';
  html += '<div class="form-row">';
  html += `<input id="usernameInput" class="field-control" type="text" placeholder="Contoh: Aisyah" value="${escapeAttr(APP_STATE.username || '')}" />`;
  html += `<button type="button" class="btn btn-primary" data-action="save-username" ${
    APP_STATE.profileSaving ? 'disabled aria-busy="true"' : ''
  }>${APP_STATE.profileSaving ? 'Menyimpan...' : 'Simpan Nama Belajar'}</button>`;
  html += '</div>';
  if (APP_STATE.profileFeedback && APP_STATE.profileFeedback.message) {
    html += `<p class="profile-feedback profile-feedback--${escapeAttr(APP_STATE.profileFeedback.type || 'info')}">${escapeHtml(
      APP_STATE.profileFeedback.message
    )}</p>`;
  }
  html += '</section>';

  html += '<section class="card search-card">';
  html += '<h3>Cari Materi Iqro</h3>';
  html += '<p class="muted">Temukan materi berdasarkan judul dan level supaya sesi belajar lebih terarah.</p>';
  html += '<div class="form-grid">';
  html += '<input id="searchTitleInput" class="field-control" type="text" placeholder="Cari judul materi..." />';
  html += '<select id="searchCategoryInput" class="field-control">';
  html += '<option value="">Semua kategori</option>';
  APP_STATE.categories.forEach((category) => {
    html += `<option value="${escapeAttr(String(category.category_id || ''))}">${escapeHtml(
      category.category_name || '-'
    )}</option>`;
  });
  html += '</select>';
  html += '</div>';
  html += '<div class="form-row">';
  html += '<button type="button" class="btn btn-primary" data-action="search-materials">Cari Materi</button>';
  html += '<button type="button" class="btn" data-action="reset-search">Reset</button>';
  html += '</div>';
  html += '</section>';

  html += '<section class="card learning-flow">';
  html += '<h3>Alur Belajar yang Disarankan</h3>';
  html += '<div class="flow-grid">';
  html += '<article><span>1</span><p>Isi profil belajar anak terlebih dahulu.</p></article>';
  html += '<article><span>2</span><p>Pilih level Iqro sesuai kemampuan saat ini.</p></article>';
  html += '<article><span>3</span><p>Latihan rutin, lalu tandai materi yang sudah lancar.</p></article>';
  html += '</div>';
  html += '</section>';

  html += '<section class="section-header"><h3>Level & Materi Iqro</h3></section>';

  if (!APP_STATE.categories.length) {
    html += '<div class="card empty">Belum ada kategori aktif.</div>';
    setMain(html);
    return;
  }

  html += '<section class="category-grid">';
  APP_STATE.categories.forEach((category) => {
    const categoryId = escapeAttr(String(category.category_id || ''));
    const categoryName = escapeAttr(String(category.category_name || ''));

    html += '<article class="card category-card">';
    html += `<div class="category-icon">${escapeHtml(pickCategoryEmoji(category.category_name || 'Kategori'))}</div>`;
    html += `<h3>${escapeHtml(category.category_name || '-')}</h3>`;
    html += `<p class="muted">${escapeHtml(
      category.description || 'Materi disusun ringan, bertahap, dan mudah dipahami anak.'
    )}</p>`;
    html += '<div class="category-foot">';
    html += `<button type="button" class="btn btn-primary" data-action="open-category" data-category-id="${categoryId}" data-category-name="${categoryName}">Lihat Materi</button>`;
    html += '</div>';
    html += '</article>';
  });
  html += '</section>';

  setMain(html);
}

async function saveUsernameProfile() {
  if (APP_STATE.profileSaving) return;

  const input = document.getElementById('usernameInput');
  const username = normalizeUsernameInput((input && input.value) || '');

  if (!username) {
    setProfileFeedback('error', 'Nama pengguna belum diisi. Isi dulu agar progres bisa disimpan.');
    if (input) input.focus();
    return;
  }

  if (username.length < 2) {
    setProfileFeedback('error', 'Nama minimal 2 karakter agar mudah dikenali saat belajar.');
    if (input) input.focus();
    return;
  }

  setProfileSaving(true);
  setProfileFeedback('info', 'Menyimpan nama belajar...');

  APP_STATE.username = username;

  try {
    const storedIn = writeStorageValue(STORAGE_KEYS.USERNAME, username);
    if (!storedIn) {
      setProfileFeedback(
        'error',
        'Nama belum bisa disimpan di browser ini. Izinkan penyimpanan lokal (storage) lalu coba lagi.'
      );
      return;
    }

    const syncSuccess = await resolveSyncProgressWithTimeout(4000);
    if (syncSuccess) {
      setProfileFeedback(
        'success',
        storedIn === 'local'
          ? 'Nama belajar berhasil disimpan. Progres siap dipantau.'
          : 'Nama tersimpan untuk sesi ini. Progres siap dipantau selama browser tetap terbuka.'
      );
    } else {
      setProfileFeedback(
        'warning',
        storedIn === 'local'
          ? 'Nama berhasil disimpan, tetapi sinkron progres sedang lambat. Silakan lanjut belajar, sinkron akan dicoba lagi.'
          : 'Nama tersimpan untuk sesi ini. Sinkron progres sedang lambat, coba lagi sebentar.'
      );
    }
  } catch (_error) {
    setProfileFeedback('error', 'Terjadi kendala saat menyimpan nama. Silakan coba lagi.');
  } finally {
    setProfileSaving(false);
    renderHome();
  }
}

async function syncProgressForCurrentUser(options) {
  const silent = options && options.silent;
  const username = String(APP_STATE.username || '').trim();

  if (!username) {
    APP_STATE.completedMaterialMap = {};
    APP_STATE.progressItems = [];
    return true;
  }

  try {
    const response = await apiGetLearningProgress(username);
    if (!response.success) {
      if (!silent) {
        showError(response.message || 'Gagal mengambil progres belajar.');
      }
      return false;
    }

    const payload = response.data || {};
    const completedIds = Array.isArray(payload.completed_material_ids) ? payload.completed_material_ids : [];

    const map = {};
    completedIds.forEach((id) => {
      map[String(id)] = true;
    });

    APP_STATE.completedMaterialMap = map;
    APP_STATE.progressItems = Array.isArray(payload.items) ? payload.items : [];
    return true;
  } catch (error) {
    if (!silent) {
      showError(`Gagal sinkron progres: ${error.message}`);
    }
    return false;
  }
}

async function runMaterialSearch() {
  const titleInput = document.getElementById('searchTitleInput');
  const categoryInput = document.getElementById('searchCategoryInput');

  const searchTitle = String((titleInput && titleInput.value) || '').trim();
  const categoryId = String((categoryInput && categoryInput.value) || '').trim();

  await loadMaterialSearchResults(searchTitle, categoryId);
}

async function loadMaterialSearchResults(searchTitle, categoryId) {
  showLoading('Mencari materi...');

  try {
    const response = await apiSearchMaterials(searchTitle, categoryId);
    if (!response.success) {
      showError(response.message || 'Gagal mencari materi.');
      return;
    }

    const materials = response.data || [];
    let html = '<section class="card">';
    html += '<button type="button" class="btn" data-action="go-home">← Kembali</button>';
    html += '<h2>Hasil Pencarian Materi</h2>';
    html += '<p class="muted">Filter judul dan kategori dengan JavaScript sederhana tanpa framework.</p>';
    html += '</section>';

    if (!materials.length) {
      html += '<div class="card empty">Tidak ada materi yang cocok dengan filter pencarian.</div>';
      setMain(html);
      return;
    }

    html += '<section class="grid">';
    materials.forEach((item) => {
      const materialId = String(item.material_id || '');
      const categoryName = item.category_name || getCategoryNameById(item.category_id);

      html += '<article class="card material-card">';
      html += `<span class="meta">Kategori: ${escapeHtml(categoryName || '-')}</span>`;
      html += `<span class="meta">Level: ${escapeHtml(String(item.level_name || '-'))}</span>`;
      html += getMaterialCompleteBadge(materialId);
      html += `<h3>${escapeHtml(item.title || '-')}</h3>`;
      if (item.subtitle) {
        html += `<p class="muted">${escapeHtml(item.subtitle)}</p>`;
      }
      html += `<button type="button" class="btn btn-primary" data-action="open-material" data-material-id="${escapeAttr(
        materialId
      )}" data-category-id="${escapeAttr(String(item.category_id || ''))}" data-category-name="${escapeAttr(
        String(categoryName || '')
      )}">Buka Detail</button>`;
      html += '</article>';
    });
    html += '</section>';

    setMain(html);
  } catch (error) {
    showError(`Gagal mencari materi: ${error.message}`);
  }
}

async function loadMaterialsByCategory(categoryId, categoryName) {
  APP_STATE.selectedCategory = { id: categoryId, name: categoryName };
  showLoading('Memuat daftar materi...');

  try {
    const response = await apiGetMaterialsByCategory(categoryId);
    if (!response.success) {
      showError(response.message || 'Gagal memuat materi.');
      return;
    }

    const materials = response.data || [];
    let html = '<section class="card">';
    html += '<button type="button" class="btn" data-action="go-home">← Kembali</button>';
    html += `<h2>Materi: ${escapeHtml(categoryName || '-')}</h2>`;
    html += '<p class="muted">Tandai materi yang selesai agar progres tersimpan ke Google Sheets.</p>';
    html += '</section>';

    if (!materials.length) {
      html += '<div class="card empty">Belum ada materi aktif untuk kategori ini.</div>';
      setMain(html);
      return;
    }

    html += '<section class="grid">';
    materials.forEach((item) => {
      const materialId = String(item.material_id || '');

      html += '<article class="card material-card">';
      html += `<span class="meta">Urutan: ${escapeHtml(String(item.sort_order || '-'))}</span>`;
      html += `<span class="meta">Level: ${escapeHtml(String(item.level_name || '-'))}</span>`;
      html += getMaterialCompleteBadge(materialId);
      html += `<h3>${escapeHtml(item.title || '-')}</h3>`;
      if (item.subtitle) {
        html += `<p class="muted">${escapeHtml(item.subtitle)}</p>`;
      }
      html += `<button type="button" class="btn btn-primary" data-action="open-material" data-material-id="${escapeAttr(
        materialId
      )}" data-category-id="${escapeAttr(String(categoryId || ''))}" data-category-name="${escapeAttr(
        String(categoryName || '')
      )}">Buka Detail</button>`;
      html += '</article>';
    });
    html += '</section>';

    setMain(html);
  } catch (error) {
    showError(`Gagal memuat materi: ${error.message}`);
  }
}

async function loadMaterialDetail(materialId) {
  APP_STATE.selectedMaterialId = materialId;
  showLoading('Memuat detail materi...');

  try {
    const response = await apiGetMaterialById(materialId);
    if (!response.success || !response.data) {
      showError(response.message || 'Detail materi tidak ditemukan.');
      return;
    }

    const item = response.data;
    const categoryId = APP_STATE.selectedCategory ? APP_STATE.selectedCategory.id : String(item.category_id || '');
    const categoryName = APP_STATE.selectedCategory
      ? APP_STATE.selectedCategory.name
      : getCategoryNameById(item.category_id) || 'Kategori';
    const isCompleted = isMaterialCompleted(materialId);

    let html = '<section class="card">';
    html += `<button type="button" class="btn" data-action="back-materials" data-category-id="${escapeAttr(
      String(categoryId || '')
    )}" data-category-name="${escapeAttr(String(categoryName || 'Kategori'))}">← Kembali ke Daftar</button>`;
    html += `<h2>${escapeHtml(item.title || '-')}</h2>`;

    if (item.subtitle) {
      html += `<p class="muted">${escapeHtml(item.subtitle)}</p>`;
    }

    if (isCompleted) {
      html += '<div class="completed-pill">✅ Materi ini sudah ditandai selesai.</div>';
    }

    html += '<div class="sticky-actions">';
    html += `<button type="button" class="btn btn-primary" data-action="mark-material-complete" data-material-id="${escapeAttr(
      String(item.material_id || materialId)
    )}" data-material-title="${escapeAttr(String(item.title || ''))}" data-category-id="${escapeAttr(
      String(categoryId || '')
    )}" data-category-name="${escapeAttr(String(categoryName || ''))}" ${isCompleted ? 'disabled' : ''}>${
      isCompleted ? 'Sudah Selesai' : 'Tandai Selesai'
    }</button>`;
    html += '</div>';

    if (item.content_arab) {
      html += `<div class="detail-arab">${escapeHtml(item.content_arab)}</div>`;
    }
    if (item.content_latin) {
      html += `<p class="detail-latin"><strong>Latin:</strong><br />${nl2br(escapeHtml(item.content_latin))}</p>`;
    }
    if (item.content_translation) {
      html += `<p class="detail-translation"><strong>Terjemahan:</strong><br />${nl2br(
        escapeHtml(item.content_translation)
      )}</p>`;
    }
    if (item.image_url) {
      html += `<img class="material-image" src="${escapeAttr(item.image_url)}" alt="Gambar materi" />`;
    }
    if (item.audio_url) {
      html += '<section class="audio-player">';
      html += '<p><strong>🎧 Pemutar Audio</strong></p>';
      html += `<audio controls preload="none" src="${escapeAttr(item.audio_url)}"></audio>`;
      html += '</section>';
    }
    html += '</section>';

    setMain(html);
  } catch (error) {
    showError(`Gagal memuat detail materi: ${error.message}`);
  }
}

async function markMaterialAsCompleted(materialId, materialTitle, categoryId, categoryName) {
  if (!materialId) {
    showError('Material ID tidak valid.');
    return;
  }

  if (!APP_STATE.username) {
    showError('Isi dan simpan nama pengguna terlebih dahulu agar progres dapat disimpan.');
    return;
  }

  showLoading('Menyimpan progres belajar...');

  try {
    const response = await apiSaveLearningProgress({
      username: APP_STATE.username,
      materialId: materialId,
      materialTitle: materialTitle,
      categoryId: categoryId,
      categoryName: categoryName
    });

    if (!response.success) {
      showError(response.message || 'Gagal menyimpan progres belajar.');
      return;
    }

    await syncProgressForCurrentUser({ silent: true });
    await loadMaterialDetail(materialId);
  } catch (error) {
    showError(`Gagal menyimpan progres: ${error.message}`);
  }
}

async function loadDailyPrayers() {
  showLoading('Memuat doa harian...');

  try {
    const response = await callApi('getDailyPrayers');
    if (!response.success) {
      showError(response.message || 'Gagal memuat doa harian.');
      return;
    }

    const list = response.data || [];
    let html = '<section class="card"><h2>Doa Harian</h2></section>';

    if (!list.length) {
      html += '<div class="card empty">Belum ada doa harian aktif.</div>';
    } else {
      list.forEach((item) => {
        html += '<article class="card prayer-card">';
        html += `<h3>${escapeHtml(item.title || '-')}</h3>`;
        html += `<div class="detail-arab">${escapeHtml(item.arabic_text || '-')}</div>`;
        html += `<p><strong>Latin:</strong><br />${nl2br(escapeHtml(item.latin_text || '-'))}</p>`;
        html += `<p><strong>Terjemahan:</strong><br />${nl2br(escapeHtml(item.translation_text || '-'))}</p>`;
        html += '</article>';
      });
    }

    setMain(html);
  } catch (error) {
    showError(`Gagal memuat doa harian: ${error.message}`);
  }
}

async function loadDzikir(type) {
  APP_STATE.dzikirType = type || '';
  showLoading('Memuat data zikir...');

  try {
    const response = await callApi('getDzikirByType', { type: APP_STATE.dzikirType });
    if (!response.success) {
      showError(response.message || 'Gagal memuat zikir.');
      return;
    }

    const list = response.data || [];
    let html = '<section class="card">';
    html += '<h2>Zikir Pagi & Petang</h2>';
    html += '<div class="form-row">';
    html += '<button type="button" class="btn" data-action="open-zikir" data-type="">Semua</button>';
    html += '<button type="button" class="btn" data-action="open-zikir" data-type="pagi">Pagi</button>';
    html += '<button type="button" class="btn" data-action="open-zikir" data-type="petang">Petang</button>';
    html += '</div></section>';

    if (!list.length) {
      html += '<div class="card empty">Belum ada data zikir aktif untuk filter ini.</div>';
    } else {
      list.forEach((item) => {
        html += '<article class="card dzikir-card">';
        html += `<span class="meta">Tipe: ${escapeHtml(item.dzikir_type || '-')}</span>`;
        html += `<span class="meta">Ulang: ${escapeHtml(String(item.repeat_count || '-'))}x</span>`;
        html += `<h3>${escapeHtml(item.title || '-')}</h3>`;
        html += `<div class="detail-arab">${escapeHtml(item.arabic_text || '-')}</div>`;
        html += `<p><strong>Latin:</strong><br />${nl2br(escapeHtml(item.latin_text || '-'))}</p>`;
        html += `<p><strong>Terjemahan:</strong><br />${nl2br(escapeHtml(item.translation_text || '-'))}</p>`;
        html += '</article>';
      });
    }

    setMain(html);
  } catch (error) {
    showError(`Gagal memuat zikir: ${error.message}`);
  }
}

async function loadQuranSurahs() {
  APP_STATE.selectedSurah = null;
  showLoading('Memuat daftar surat...');

  try {
    const response = await callApi('getQuranSurahs');
    if (!response.success) {
      showError(response.message || 'Gagal memuat daftar surat.');
      return;
    }

    const list = response.data || [];
    let html =
      '<section class="card"><h2>Daftar Surat Al-Quran</h2><p class="muted">Klik surat untuk melihat ayat.</p></section>';

    if (!list.length) {
      html += '<div class="card empty">Belum ada data surat aktif.</div>';
    } else {
      html += '<section class="grid">';
      list.forEach((surah) => {
        html += '<article class="card surah-card">';
        html += `<h3>${escapeHtml(String(surah.surah_number || '-'))}. ${escapeHtml(surah.surah_name_latin || '-')}</h3>`;
        html += `<p class="muted">${escapeHtml(surah.surah_name_indonesia || '-')}</p>`;
        html += `<span class="meta">Ayat: ${escapeHtml(String(surah.total_verses || '-'))}</span>`;
        html += `<span class="meta">Wahyu: ${escapeHtml(surah.revelation_type || '-')}</span>`;
        html += `<button type="button" class="btn btn-primary" data-action="open-surah" data-surah-id="${escapeAttr(
          String(surah.surah_id || '')
        )}" data-surah-name="${escapeAttr(String(surah.surah_name_latin || ''))}">Lihat Ayat</button>`;
        html += '</article>';
      });
      html += '</section>';
    }

    setMain(html);
  } catch (error) {
    showError(`Gagal memuat surat: ${error.message}`);
  }
}

async function loadQuranVerses(surahId, surahName) {
  APP_STATE.selectedSurah = { id: surahId, name: surahName };
  showLoading('Memuat ayat surat...');

  try {
    const response = await callApi('getQuranVersesBySurah', { surahId });
    if (!response.success) {
      showError(response.message || 'Gagal memuat ayat surat.');
      return;
    }

    const list = response.data || [];
    let html = '<section class="card">';
    html += '<button type="button" class="btn" data-action="open-quran">← Kembali ke Daftar Surat</button>';
    html += `<h2>Surat: ${escapeHtml(surahName || '-')}</h2>`;
    html += '</section>';

    if (!list.length) {
      html += '<div class="card empty">Belum ada ayat aktif pada surat ini.</div>';
    } else {
      list.forEach((verse) => {
        html += '<article class="card">';
        html += `<span class="meta">Ayat ${escapeHtml(String(verse.verse_number || '-'))}</span>`;
        html += `<div class="detail-arab">${escapeHtml(verse.arabic_text || '-')}</div>`;
        html += `<p><strong>Latin:</strong><br />${nl2br(escapeHtml(verse.latin_text || '-'))}</p>`;
        html += `<p><strong>Terjemahan:</strong><br />${nl2br(escapeHtml(verse.translation_text || '-'))}</p>`;
        if (verse.audio_url) {
          html += `<audio controls src="${escapeAttr(verse.audio_url)}"></audio>`;
        }
        html += '</article>';
      });
    }

    setMain(html);
  } catch (error) {
    showError(`Gagal memuat ayat: ${error.message}`);
  }
}

function isMaterialCompleted(materialId) {
  return Boolean(APP_STATE.completedMaterialMap[String(materialId || '')]);
}

function getMaterialCompleteBadge(materialId) {
  if (!isMaterialCompleted(materialId)) {
    return '';
  }
  return '<span class="meta completed-meta">Selesai ✅</span>';
}

function getCategoryNameById(categoryId) {
  const targetId = String(categoryId || '');
  const found = APP_STATE.categories.find((item) => String(item.category_id || '') === targetId);
  return found ? String(found.category_name || '') : '';
}

function pickCategoryEmoji(name) {
  const normalized = String(name || '').toLowerCase();
  if (normalized.indexOf('iqro') !== -1) return '📘';
  if (normalized.indexOf('huruf') !== -1) return '🔤';
  if (normalized.indexOf('doa') !== -1) return '🤲';
  if (normalized.indexOf('quran') !== -1) return '🕌';
  if (normalized.indexOf('zikir') !== -1) return '🌙';
  return '⭐';
}

function loadStoredUsername() {
  return String(readStorageValue(STORAGE_KEYS.USERNAME) || '').trim();
}

function normalizeUsernameInput(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function setProfileSaving(isSaving) {
  APP_STATE.profileSaving = Boolean(isSaving);

  const saveButton = document.querySelector('[data-action="save-username"]');
  if (!saveButton) return;

  saveButton.disabled = APP_STATE.profileSaving;
  saveButton.setAttribute('aria-busy', APP_STATE.profileSaving ? 'true' : 'false');
  saveButton.textContent = APP_STATE.profileSaving ? 'Menyimpan...' : 'Simpan Nama Belajar';
}

function setProfileFeedback(type, message) {
  APP_STATE.profileFeedback = {
    type: String(type || 'info'),
    message: String(message || '')
  };

  const feedbackEl = document.querySelector('.profile-feedback');
  if (!feedbackEl) return;

  feedbackEl.className = `profile-feedback profile-feedback--${escapeAttr(APP_STATE.profileFeedback.type)}`;
  feedbackEl.textContent = APP_STATE.profileFeedback.message;
}

function readStorageValue(key) {
  try {
    const localValue = localStorage.getItem(key);
    if (localValue) return localValue;
  } catch (_error) {
    // Ignore and fallback to session storage
  }

  try {
    return sessionStorage.getItem(key);
  } catch (_error) {
    return '';
  }
}

function writeStorageValue(key, value) {
  try {
    localStorage.setItem(key, value);
    return 'local';
  } catch (_error) {
    // Ignore and fallback to session storage
  }

  try {
    sessionStorage.setItem(key, value);
    return 'session';
  } catch (_error) {
    return '';
  }
}

async function resolveSyncProgressWithTimeout(timeoutMs) {
  const waitTimeout = Number(timeoutMs) > 0 ? Number(timeoutMs) : 4000;

  let timeoutId = null;
  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve(false), waitTimeout);
  });

  try {
    const syncResult = await Promise.race([syncProgressForCurrentUser({ silent: true }), timeoutPromise]);
    return syncResult === true;
  } catch (_error) {
    return false;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#096;');
}

function nl2br(value) {
  return String(value).replace(/\n/g, '<br />');
}
