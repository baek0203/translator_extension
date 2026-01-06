// 번역기 상태 관리
let translateButton = null;
let translationPopup = null;
let selectedText = '';
let selectionRange = null;

// [1] 초기화 및 클린업
function cleanupTranslator() {
  translateButton?.remove();
  translationPopup?.remove();
}

// [2] 구글 스타일 번역 버튼 생성
function createTranslateButton() {
  if (translateButton) return translateButton;

  const button = document.createElement('div');
  button.className = 'google-style-btn';
  // 구글 번역 아이콘 (SVG)
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" fill="#4285F4"/>
    </svg>
  `;
  button.style.display = 'none';
  document.body.appendChild(button);

  button.addEventListener('click', async (e) => {
    e.stopPropagation();
    hideTranslateButton();
    showTranslationPopup();
    // 버튼 클릭 시 즉시 한국어(ko)로 번역 시작
    await translateText(selectedText, 'ko');
  });

  translateButton = button;
  return button;
}

// [3] 구글 스타일 팝업 생성
function createTranslationPopup() {
  if (translationPopup) return translationPopup;

  const popup = document.createElement('div');
  popup.className = 'google-style-popup';
  popup.style.display = 'none';
  popup.innerHTML = `
    <div class="popup-header">
      <span class="lang-info">언어(감지됨) → 한국어</span>
      <button class="close-x">✕</button>
    </div>
    <div class="popup-content">
      <div id="translated-text" class="result-text">번역 중...</div>
    </div>
    <div class="popup-footer">
      <button id="go-google-web">모든 번역 보기</button>
    </div>
  `;

  document.body.appendChild(popup);

  // 닫기 버튼
  popup.querySelector('.close-x').addEventListener('click', hideTranslationPopup);
  
  // 구글 사이트 이동 버튼
  popup.querySelector('#go-google-web').addEventListener('click', () => {
    const googleUrl = `https://translate.google.com/?sl=auto&tl=ko&text=${encodeURIComponent(selectedText)}&op=translate`;
    window.open(googleUrl, '_blank');
  });

  translationPopup = popup;
  return popup;
}

// [4] 번역 로직 (기존 유지하되 UI만 업데이트)
async function translateText(text, targetLang) {
  const resultEl = document.getElementById('translated-text');
  if (!resultEl) return;

  try {
    // [보강] 크롬 런타임이 유효한지 먼저 확인
    if (!chrome.runtime?.id) {
      throw new Error('EXT_INVALIDATED');
    }

    const response = await chrome.runtime.sendMessage({
      action: 'translate',
      text: text,
      targetLang: targetLang
    });

    if (response && response.success) {
      resultEl.textContent = response.translatedText;
    } else {
      resultEl.textContent = "번역에 실패했습니다.";
    }
  } catch (err) {
    // 사용자가 이해하기 쉬운 안내 문구로 교체
    if (err.message === 'EXT_INVALIDATED' || err.message.includes('context invalidated')) {
      resultEl.innerHTML = `확장 프로그램이 업데이트되었습니다.<br><span style="font-size:12px; color:#aaa;">페이지를 새로고침(F5) 해주세요.</span>`;
    } else {
      resultEl.textContent = "오류가 발생했습니다.";
    }
    console.warn('Translation Error:', err.message);
  }
}

// [5] 텍스트 선택 및 위치 계산 (기존 로직 최적화)
function handleTextSelection() {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (text.length > 0) {
    selectedText = text;
    selectionRange = selection.getRangeAt(0);
    
    // [수정] 선택된 텍스트의 모든 사각형 영역을 가져옵니다.
    const rects = selectionRange.getClientRects();
    // 마지막 줄의 사각형 영역을 선택합니다.
    const lastRect = rects[rects.length - 1];

    if (lastRect) {
      const btn = createTranslateButton();
      
      // 마지막 글자의 중앙 아래에 위치시키기 위한 계산
      const btnWidth = 32; // CSS에서 설정한 버튼 너비에 맞춰 조절하세요
      const btnX = lastRect.left + (lastRect.width / 2) + window.scrollX - (btnWidth / 2);
      const btnY = lastRect.bottom + window.scrollY + 8; // 글자 하단에서 8px 여백

      btn.style.left = `${btnX}px`;
      btn.style.top = `${btnY}px`;
      btn.style.display = 'flex';
      btn.style.position = 'absolute'; // 절대 위치 보장
    }
  } else {
    hideTranslateButton();
  }
}

function hideTranslateButton() { if(translateButton) translateButton.style.display = 'none'; }
function hideTranslationPopup() { if(translationPopup) translationPopup.style.display = 'none'; }
function showTranslationPopup() { 
    const popup = createTranslationPopup();
    const rect = selectionRange.getBoundingClientRect();
    popup.style.left = `${rect.left + window.scrollX}px`;
    popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
    popup.style.display = 'block'; 
}

// 이벤트 리스너
// [수정] 마우스 버튼을 누를 때 팝업 외부 클릭 여부를 확인합니다.
document.addEventListener('mousedown', (e) => {
  // 1. 팝업이 현재 보이고 있는 상태인지 확인합니다.
  if (translationPopup && translationPopup.style.display === 'block') {
    
    // 2. 클릭된 요소(e.target)가 팝업 내부에 포함되어 있는지 확인합니다.
    const isClickInsidePopup = translationPopup.contains(e.target);
    // 3. 클릭된 요소가 번역 실행 버튼인지 확인합니다.
    const isClickOnButton = translateButton && translateButton.contains(e.target);

    // 4. 팝업 밖을 클릭했고, 번역 버튼도 클릭한 게 아니라면 팝업을 닫습니다.
    if (!isClickInsidePopup && !isClickOnButton) {
      hideTranslationPopup();
    }
  }
});

// [기존 유지] 텍스트 선택 이벤트
document.addEventListener('mouseup', (e) => {
  // 번역 버튼이나 팝업 내부를 클릭할 때는 새로운 선택 로직이 실행되지 않도록 방지합니다.
  if (e.target.closest('.google-style-btn') || e.target.closest('.google-style-popup')) {
    return;
  }

  setTimeout(handleTextSelection, 10);
});

// [추가 권장] ESC 키를 눌러도 팝업이 닫히도록 하면 UX가 더 좋아집니다.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hideTranslationPopup();
    hideTranslateButton();
  }
});