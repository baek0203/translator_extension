// 전역 상태
let isSelectMode = false;
let selectedIds = new Set();

// 번역 기록 로드
async function loadTranslations() {
  const container = document.getElementById('container');

  try {
    const result = await chrome.storage.local.get(['translations']);
    const translations = result.translations || [];

    if (translations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
          </svg>
          <p>저장된 번역 기록이 없습니다</p>
        </div>
      `;
      return;
    }

    container.innerHTML = translations.map(item => `
      <div class="translation-item" data-id="${item.id}">
        <input type="checkbox" class="select-checkbox" data-id="${item.id}" />
        <div class="item-wrapper">
          <div class="item-header">
            <span class="item-date">${item.date}</span>
            <div class="item-actions">
              <button class="item-btn copy-btn" data-text="${escapeHtml(item.translated)}">복사</button>
              <button class="item-btn delete delete-btn" data-id="${item.id}">삭제</button>
            </div>
          </div>
          <div class="item-content">
            <div class="toggle-header">
              <button class="toggle-btn">
                <svg class="toggle-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 17l5-5-5-5v10z"/>
                </svg>
              </button>
              <div class="text-content original collapsed">${escapeHtml(item.original)}</div>
            </div>
            <div class="text-section translated-section" style="display: none;">
              <div class="text-label">번역</div>
              <div class="text-content translated">${escapeHtml(item.translated)}</div>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // 토글 버튼 이벤트
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = btn.closest('.translation-item');
        const translatedSection = item.querySelector('.translated-section');
        const icon = btn.querySelector('.toggle-icon');
        const isExpanded = translatedSection.style.display !== 'none';

        if (isExpanded) {
          translatedSection.style.display = 'none';
          icon.style.transform = 'rotate(0deg)';
        } else {
          translatedSection.style.display = 'block';
          icon.style.transform = 'rotate(90deg)';
        }
      });
    });

    // 복사 버튼 이벤트
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = e.target.getAttribute('data-text');
        copyToClipboard(text, btn);
      });
    });

    // 삭제 버튼 이벤트
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));
        deleteTranslation(id);
      });
    });

    // 체크박스 이벤트
    document.querySelectorAll('.select-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'));

        if (e.target.checked) {
          selectedIds.add(id);
        } else {
          selectedIds.delete(id);
        }

        updateActionBar();
      });
    });

  } catch (error) {
    console.error('번역 기록 로드 실패:', error);
    container.innerHTML = '<div class="empty-state"><p>데이터 로드 중 오류가 발생했습니다</p></div>';
  }
}

// HTML 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 클립보드에 복사
async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const originalText = button.textContent;
    button.textContent = '✓ 복사됨';
    setTimeout(() => {
      button.textContent = originalText;
    }, 1500);
  } catch (error) {
    console.error('복사 실패:', error);
    alert('복사에 실패했습니다.');
  }
}

// 개별 항목 삭제
async function deleteTranslation(id) {
  if (!confirm('이 번역 기록을 삭제하시겠습니까?')) {
    return;
  }

  try {
    const result = await chrome.storage.local.get(['translations']);
    const translations = result.translations || [];
    const filtered = translations.filter(item => item.id !== id);

    await chrome.storage.local.set({ translations: filtered });
    loadTranslations();
  } catch (error) {
    console.error('삭제 실패:', error);
    alert('삭제에 실패했습니다.');
  }
}

// 전체 삭제
async function clearAllTranslations() {
  if (!confirm('모든 번역 기록을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
    return;
  }

  try {
    await chrome.storage.local.set({ translations: [] });
    loadTranslations();
  } catch (error) {
    console.error('전체 삭제 실패:', error);
    alert('삭제에 실패했습니다.');
  }
}

// JSON 내보내기
async function exportTranslations() {
  try {
    const result = await chrome.storage.local.get(['translations']);
    const translations = result.translations || [];

    if (translations.length === 0) {
      alert('내보낼 번역 기록이 없습니다.');
      return;
    }

    const dataStr = JSON.stringify(translations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `translations_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('내보내기 실패:', error);
    alert('내보내기에 실패했습니다.');
  }
}

// 선택 모드 토글
function toggleSelectMode() {
  const container = document.getElementById('container');
  const header = document.querySelector('.header');
  const selectModeBtn = document.getElementById('select-mode-btn');

  isSelectMode = !isSelectMode;
  selectedIds.clear();

  if (isSelectMode) {
    container.classList.add('select-mode');
    header.classList.add('select-mode-active');
    selectModeBtn.textContent = '취소';
  } else {
    container.classList.remove('select-mode');
    header.classList.remove('select-mode-active');
    selectModeBtn.textContent = '선택';

    // 모든 체크박스 해제
    document.querySelectorAll('.select-checkbox').forEach(cb => {
      cb.checked = false;
    });
  }

  updateActionBar();
}

// 액션 바 업데이트
function updateActionBar() {
  const actionBar = document.getElementById('action-bar');
  const selectedCount = document.getElementById('selected-count');

  if (isSelectMode && selectedIds.size > 0) {
    actionBar.classList.remove('hidden');
    selectedCount.textContent = `${selectedIds.size}개 선택`;
  } else {
    actionBar.classList.add('hidden');
  }
}

// 전체선택 토글
async function toggleSelectAll() {
  try {
    const result = await chrome.storage.local.get(['translations']);
    const translations = result.translations || [];
    const allIds = translations.map(item => item.id);

    // 모두 선택되어 있으면 해제, 아니면 전체 선택
    const allSelected = allIds.every(id => selectedIds.has(id));

    if (allSelected) {
      // 전체 해제
      selectedIds.clear();
      document.querySelectorAll('.select-checkbox').forEach(cb => {
        cb.checked = false;
      });
    } else {
      // 전체 선택
      selectedIds = new Set(allIds);
      document.querySelectorAll('.select-checkbox').forEach(cb => {
        cb.checked = true;
      });
    }

    updateActionBar();
  } catch (error) {
    console.error('전체선택 실패:', error);
  }
}

// 선택된 항목 삭제
async function deleteSelected() {
  if (selectedIds.size === 0) return;

  if (!confirm(`선택한 ${selectedIds.size}개의 번역 기록을 삭제하시겠습니까?`)) {
    return;
  }

  try {
    const result = await chrome.storage.local.get(['translations']);
    const translations = result.translations || [];
    const filtered = translations.filter(item => !selectedIds.has(item.id));

    await chrome.storage.local.set({ translations: filtered });

    selectedIds.clear();
    loadTranslations();
    updateActionBar();
  } catch (error) {
    console.error('선택 삭제 실패:', error);
    alert('삭제에 실패했습니다.');
  }
}

// 메뉴 토글
function toggleMenu() {
  const menuDropdown = document.getElementById('menu-dropdown');
  menuDropdown.classList.toggle('hidden');
}

// 메뉴 외부 클릭 시 닫기
function closeMenu() {
  const menuDropdown = document.getElementById('menu-dropdown');
  menuDropdown.classList.add('hidden');
}

// 문의하기
function openContactForm() {
  chrome.tabs.create({
    url: 'https://forms.gle/EzyJPL7aD3wKY8X49'
  });
  closeMenu();
}

// 정보 모달 열기
function openInfoModal() {
  const modal = document.getElementById('info-modal');
  modal.classList.remove('hidden');
  closeMenu();
}

// 정보 모달 닫기
function closeInfoModal() {
  const modal = document.getElementById('info-modal');
  modal.classList.add('hidden');
}

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
  loadTranslations();

  document.getElementById('select-mode-btn').addEventListener('click', toggleSelectMode);
  document.getElementById('select-all-btn').addEventListener('click', toggleSelectAll);
  document.getElementById('clear-btn').addEventListener('click', deleteSelected);
  document.getElementById('export-btn').addEventListener('click', exportTranslations);
  document.getElementById('delete-selected-btn').addEventListener('click', deleteSelected);
  document.getElementById('cancel-select-btn').addEventListener('click', toggleSelectMode);

  // 메뉴 관련
  document.getElementById('menu-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  document.getElementById('contact-btn').addEventListener('click', openContactForm);
  document.getElementById('info-btn').addEventListener('click', openInfoModal);
  document.getElementById('close-info-btn').addEventListener('click', closeInfoModal);

  // 모달 배경 클릭 시 닫기
  document.querySelector('.modal-backdrop')?.addEventListener('click', closeInfoModal);

  // 문서 클릭 시 메뉴 닫기
  document.addEventListener('click', closeMenu);
});
