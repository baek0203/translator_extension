// Dashboard Settings Module

const Settings = {
  // UI languages (based on available locales)
  UI_LANGUAGES: [
    { code: 'en', name: 'English' },
    { code: 'ko', name: '한국어' },
    { code: 'ja', name: '日本語' },
    { code: 'zh_CN', name: '中文(简体)' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' }
  ],

  // Original settings (for cancel functionality)
  originalSettings: {},
  // Track if settings have changed
  hasChanges: false,

  init() {
    this.targetLangSelect = document.getElementById('target-language');
    this.uiLangSelect = document.getElementById('ui-language');
    this.themeSelect = document.getElementById('theme-select');
    this.saveBtn = document.getElementById('settings-save-btn');
    this.cancelBtn = document.getElementById('settings-cancel-btn');

    this.populateSelects();
    this.loadSettings();
    this.bindEvents();
    this.loadVersionInfo();
  },

  populateSelects() {
    // Populate target language dropdown (all translation languages)
    if (this.targetLangSelect && window.LANGUAGES) {
      window.LANGUAGES.forEach(lang => {
        this.targetLangSelect.add(new Option(lang.nativeName, lang.code));
      });
    }

    // Populate UI language dropdown
    this.UI_LANGUAGES.forEach(lang => {
      if (this.uiLangSelect) {
        this.uiLangSelect.add(new Option(lang.name, lang.code));
      }
    });
  },

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'targetLanguage',
        'uiLanguage',
        'theme'
      ]);

      // Store original values
      this.originalSettings = {
        targetLanguage: result.targetLanguage || 'ko',
        uiLanguage: result.uiLanguage || 'en',
        theme: result.theme || 'auto'
      };

      // Apply to selects
      if (this.targetLangSelect) {
        this.targetLangSelect.value = this.originalSettings.targetLanguage;
      }
      if (this.uiLangSelect) {
        this.uiLangSelect.value = this.originalSettings.uiLanguage;
      }
      if (this.themeSelect) {
        this.themeSelect.value = this.originalSettings.theme;
      }

      this.hasChanges = false;
      this.updateButtonStates();
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  bindEvents() {
    // Track changes on all selects
    this.targetLangSelect?.addEventListener('change', () => this.onSettingChange());
    this.uiLangSelect?.addEventListener('change', () => this.onSettingChange());
    this.themeSelect?.addEventListener('change', () => this.onSettingChange());

    // Save button
    this.saveBtn?.addEventListener('click', () => this.saveSettings());

    // Cancel button
    this.cancelBtn?.addEventListener('click', () => this.cancelChanges());
  },

  onSettingChange() {
    // Check if any value differs from original
    const currentSettings = this.getCurrentSettings();
    this.hasChanges =
      currentSettings.targetLanguage !== this.originalSettings.targetLanguage ||
      currentSettings.uiLanguage !== this.originalSettings.uiLanguage ||
      currentSettings.theme !== this.originalSettings.theme;

    this.updateButtonStates();

    // Preview theme change immediately
    if (currentSettings.theme !== this.originalSettings.theme) {
      Theme.applyTheme(currentSettings.theme);
    }
  },

  getCurrentSettings() {
    return {
      targetLanguage: this.targetLangSelect?.value || 'ko',
      uiLanguage: this.uiLangSelect?.value || 'en',
      theme: this.themeSelect?.value || 'auto'
    };
  },

  updateButtonStates() {
    if (this.saveBtn) {
      this.saveBtn.disabled = !this.hasChanges;
    }
    if (this.cancelBtn) {
      this.cancelBtn.disabled = !this.hasChanges;
    }
  },

  async saveSettings() {
    if (!this.hasChanges) return;

    const currentSettings = this.getCurrentSettings();
    const uiLanguageChanged = currentSettings.uiLanguage !== this.originalSettings.uiLanguage;

    try {
      // Save all settings
      await chrome.storage.sync.set({
        targetLanguage: currentSettings.targetLanguage,
        uiLanguage: currentSettings.uiLanguage,
        theme: currentSettings.theme
      });

      // Apply theme
      await Theme.setTheme(currentSettings.theme);

      // Update original settings
      this.originalSettings = { ...currentSettings };
      this.hasChanges = false;
      this.updateButtonStates();

      DashboardUtils.showToast(DashboardUtils.getMessage('settingsSaved') || 'Settings saved');

      // If UI language changed, prompt to reload
      if (uiLanguageChanged) {
        setTimeout(() => {
          if (confirm(DashboardUtils.getMessage('reloadToApply') || 'Reload page to apply language change?')) {
            window.location.reload();
          }
        }, 500);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      DashboardUtils.showToast('Failed to save settings');
    }
  },

  cancelChanges() {
    if (!this.hasChanges) return;

    // Restore original values
    if (this.targetLangSelect) {
      this.targetLangSelect.value = this.originalSettings.targetLanguage;
    }
    if (this.uiLangSelect) {
      this.uiLangSelect.value = this.originalSettings.uiLanguage;
    }
    if (this.themeSelect) {
      this.themeSelect.value = this.originalSettings.theme;
    }

    // Restore theme
    Theme.applyTheme(this.originalSettings.theme);

    this.hasChanges = false;
    this.updateButtonStates();

    DashboardUtils.showToast(DashboardUtils.getMessage('changesDiscarded') || 'Changes discarded');
  },

  loadVersionInfo() {
    // Load version from manifest
    const versionEl = document.getElementById('version-value');
    if (versionEl && chrome.runtime?.getManifest) {
      const manifest = chrome.runtime.getManifest();
      versionEl.textContent = manifest.version || '1.6.0';
    }
  }
};

// Make it globally available
window.Settings = Settings;
