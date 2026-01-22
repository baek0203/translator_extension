/**
 * popup.js - 번역 팝업 UI 모듈
 */

const Popup = {
  element: null,
  currentTargetLang: null,
  onLanguageChangeCallback: null,
  isDragging: false,
  dragOffsetX: 0,
  dragOffsetY: 0,

  /**
   * 팝업 생성 또는 업데이트
   */
  async create(uiTexts, targetLang) {
    this.currentTargetLang = targetLang;

    // 테마 가져오기
    const theme = await this.getTheme();

    if (!this.element) {
      const p = document.createElement('div');
      p.className = 'translator-popup';
      if (theme === 'light') {
        p.classList.add('theme-light');
      }
      p.style.display = 'none';
      p.innerHTML = `
        <div class="popup-header">
          <span id="popup-title">${uiTexts.translation}</span>
          <div class="popup-header-right">
            <select id="popup-lang-select" class="popup-lang-select"></select>
            <button class="close-x">✕</button>
          </div>
        </div>
        <div class="popup-content" id="translated-text">${uiTexts.translating}</div>
        <div class="popup-footer">
          <button id="save-translation">${uiTexts.save}</button>
          <button id="go-google-web">${uiTexts.viewAllTranslations}</button>
        </div>
      `;

      p.querySelector('.close-x').onclick = () => this.hide();

      // 언어 선택 이벤트
      const langSelect = p.querySelector('#popup-lang-select');
      langSelect.addEventListener('change', (e) => {
        this.currentTargetLang = e.target.value;
        if (this.onLanguageChangeCallback) {
          this.onLanguageChangeCallback(e.target.value);
        }
      });

      // 드래그 이동 이벤트
      const header = p.querySelector('.popup-header');
      header.addEventListener('mousedown', (e) => this.startDrag(e));
      document.addEventListener('mousemove', (e) => this.onDrag(e));
      document.addEventListener('mouseup', () => this.endDrag());

      document.body.appendChild(p);
      this.element = p;
    } else {
      this.updateTexts(uiTexts);
      // 테마 업데이트
      this.element.classList.toggle('theme-light', theme === 'light');
    }

    // 언어 목록 업데이트
    this.populateLanguageSelect(targetLang);

    return this.element;
  },

  /**
   * 언어 선택 드롭다운 채우기
   */
  populateLanguageSelect(selectedLang) {
    const select = this.element?.querySelector('#popup-lang-select');
    if (!select) return;

    // LANGUAGES가 전역으로 있음 (i18n.js에서)
    const languages = window.LANGUAGES || [];

    select.innerHTML = languages.map(lang =>
      `<option value="${lang.code}" ${lang.code === selectedLang ? 'selected' : ''}>${lang.nativeName}</option>`
    ).join('');
  },

  /**
   * UI 텍스트 업데이트
   */
  updateTexts(uiTexts) {
    if (!this.element) return;

    const popupTitle = this.element.querySelector('#popup-title');
    const saveBtn = this.element.querySelector('#save-translation');
    const viewAllBtn = this.element.querySelector('#go-google-web');
    const translatingText = this.element.querySelector('#translated-text');

    if (popupTitle) popupTitle.textContent = uiTexts.translation;
    if (saveBtn) saveBtn.textContent = uiTexts.save;
    if (viewAllBtn) viewAllBtn.textContent = uiTexts.viewAllTranslations;
    if (translatingText) translatingText.textContent = uiTexts.translating;
  },

  /**
   * 팝업 표시
   */
  show(rect) {
    if (!this.element) return;

    this.element.style.left = `${rect.left + window.scrollX}px`;
    this.element.style.top = `${rect.bottom + window.scrollY + 10}px`;
    this.element.style.display = 'block';
  },

  /**
   * 팝업 숨기기
   */
  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  },

  /**
   * 번역 결과 표시
   */
  setTranslation(text) {
    const el = this.element?.querySelector('#translated-text');
    if (el) {
      el.textContent = text;
    }
  },

  /**
   * 저장 버튼 핸들러 설정
   */
  onSave(handler) {
    const btn = this.element?.querySelector('#save-translation');
    if (btn) {
      btn.onclick = handler;
    }
  },

  /**
   * Google 번역 버튼 핸들러 설정
   */
  onGoogleWeb(handler) {
    const btn = this.element?.querySelector('#go-google-web');
    if (btn) {
      btn.onclick = handler;
    }
  },

  /**
   * 저장 버튼 상태 업데이트
   */
  setSaveButtonState(text, disabled) {
    const btn = this.element?.querySelector('#save-translation');
    if (btn) {
      btn.textContent = text;
      btn.disabled = disabled;
    }
  },

  /**
   * 팝업이 표시중인지 확인
   */
  isVisible() {
    return this.element && this.element.style.display !== 'none';
  },

  /**
   * 언어 변경 핸들러 설정
   */
  onLanguageChange(handler) {
    this.onLanguageChangeCallback = handler;
  },

  /**
   * 현재 선택된 언어 가져오기
   */
  getTargetLanguage() {
    return this.currentTargetLang;
  },

  /**
   * 드래그 시작
   */
  startDrag(e) {
    // select, button, close-x 클릭 시 드래그 안 함
    if (e.target.tagName === 'SELECT' ||
        e.target.tagName === 'BUTTON' ||
        e.target.classList.contains('close-x')) {
      return;
    }

    this.isDragging = true;
    const rect = this.element.getBoundingClientRect();
    this.dragOffsetX = e.clientX - rect.left;
    this.dragOffsetY = e.clientY - rect.top;

    // 드래그 중 텍스트 선택 방지
    e.preventDefault();
  },

  /**
   * 드래그 중
   */
  onDrag(e) {
    if (!this.isDragging || !this.element) return;

    const x = e.clientX - this.dragOffsetX + window.scrollX;
    const y = e.clientY - this.dragOffsetY + window.scrollY;

    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  },

  /**
   * 드래그 종료
   */
  endDrag() {
    this.isDragging = false;
  },

  /**
   * 테마 설정 가져오기
   */
  async getTheme() {
    try {
      const result = await chrome.storage.sync.get(['theme']);
      const theme = result.theme || 'auto';

      if (theme === 'auto') {
        // 시스템 테마 감지
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return theme;
    } catch (error) {
      return 'dark'; // 기본값
    }
  }
};

window.DT_Popup = Popup;
