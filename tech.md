# 기술 스택 문서

## 1. 플랫폼 및 언어
- **Platform**: Chrome Extension Manifest V3
- **Language**: JavaScript (ES6+), CSS3
- **Storage**: chrome.storage.sync (사용자 설정 저장)
- **Translation**: Google Translate Free API, MyMemory API, LibreTranslate API (다중 fallback)

## 2. 프로젝트 구조

```
translator_extention/
├── manifest.json          # Manifest V3 설정 (28줄)
├── background.js          # Service Worker, 번역 API 핸들러 (200줄)
├── content.js            # DOM 조작, UI 렌더링 (343줄)
├── styles.css           # 번역 버튼 & 팝업 스타일 (372줄)
└── icons/               # PNG 아이콘 (16x16, 48x48, 128x128)
```

## 3. 핵심 번역 로직

### 3.1 Google Translate 무료 엔드포인트

```javascript
// background.js에서 구현
async function translateText(text, targetLang, sourceLang = 'auto') {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetch(url);
  const data = await response.json();

  // 번역된 텍스트 추출
  let translatedText = '';
  if (data && data[0]) {
    data[0].forEach(item => {
      if (item[0]) {
        translatedText += item[0];
      }
    });
  }

  return {
    success: true,
    translatedText: translatedText,
    detectedLanguage: data[2] || sourceLang
  };
}
```

### 3.2 Fallback 메커니즘

Google Translate 실패 시 자동으로 MyMemory API로 전환:

```javascript
translateText(text, targetLang)
  .then(result => {
    if (!result.success) {
      return translateWithMyMemory(text, targetLang);
    }
    return result;
  })
  .then(result => {
    if (!result.success) {
      return translateWithLibre(text, targetLang);
    }
    return result;
  });
```

## 4. 메시지 통신 아키텍처

### 4.1 Content Script → Background Script

```javascript
// content.js
const response = await chrome.runtime.sendMessage({
  action: 'translate',
  text: selectedText,
  targetLang: 'ko'
});
```

### 4.2 Background Script 응답

```javascript
// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    translateText(request.text, request.targetLang)
      .then(result => sendResponse(result));
    return true; // 비동기 응답
  }
});
```

## 5. UI/UX 설계

### 5.1 번역 버튼
- **위치**: 텍스트 선택 영역 위 45px
- **스타일**: 그라디언트 배경 (#667eea → #764ba2)
- **애니메이션**: 0.2s cubic-bezier 트랜지션
- **크기**: 80px × 36px (동적)

```css
.translator-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transform: translateY(0) scale(1);
}
```

### 5.2 번역 팝업
- **크기**: 420px × auto (max-height: 400px)
- **위치**: 선택 영역 아래 10px, 오른쪽 끝 검사
- **구성**: 헤더(탭) + 본문(원문/번역) + 푸터(버튼)

```css
.translator-popup {
  width: 420px;
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  background: #ffffff;
}
```

## 6. 이벤트 핸들링

### 6.1 텍스트 선택 감지

```javascript
document.addEventListener('mouseup', (e) => {
  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length > 0 && text.length < 5000) {
      showTranslateButton(selection);
    }
  }, 10);
});
```

### 6.2 스크롤 처리

```javascript
document.addEventListener('scroll', () => {
  hideTranslateButton();

  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    const selection = window.getSelection();
    if (selection.toString().trim().length > 0) {
      handleTextSelection();
    }
  }, 150);
}, true);
```

## 7. 에러 핸들링

### 7.1 Extension Context 검증

```javascript
if (!chrome.runtime?.id) {
  throw new Error('Extension context invalidated. Please reload the page.');
}
```

### 7.2 사용자 친화적 오류 메시지

- **Context 무효화**: "확장 프로그램이 업데이트되었습니다. 페이지를 새로고침해주세요."
- **네트워크 오류**: "번역 중 오류가 발생했습니다."
- **API 실패**: "번역 실패" (개별 언어별)

## 8. 지원 언어 코드 매핑

```javascript
const langMap = {
  'ko': 'ko',      // 한국어
  'en': 'en',      // English
  'ja': 'ja',      // 日本語
  'zh-CN': 'zh-CN', // 中文 (简体)
  'es': 'es',      // Español
  'fr': 'fr',      // Français
  'de': 'de',      // Deutsch
  'ru': 'ru',      // Русский
  'ar': 'ar',      // العربية
  'pt': 'pt',      // Português
  'it': 'it',      // Italiano
  'vi': 'vi',      // Tiếng Việt
  'th': 'th',      // ไทย
  'id': 'id',      // Bahasa Indonesia
  'hi': 'hi'       // हिन्दी
};
```

## 9. 성능 최적화

### 9.1 CSS 트랜지션
- GPU 가속 사용 (`transform`, `opacity`)
- `will-change` 속성 사용하지 않음 (메모리 절약)

### 9.2 이벤트 디바운싱
- 스크롤: 150ms 디바운스
- 텍스트 선택: 10ms 딜레이

### 9.3 DOM 조작 최소화
- 버튼/팝업 한 번만 생성 후 재사용
- `display: none` vs 제거/재생성

## 10. 보안 고려사항

### 10.1 XSS 방지
```javascript
// 사용자 입력을 innerHTML에 직접 삽입하지 않음
translatedTextEl.textContent = response.translatedText; // ✓
translatedTextEl.innerHTML = `<p>${response.translatedText}</p>`; // ✓ (제어된 컨텍스트)
```

### 10.2 CSP 준수
- Manifest V3 기본 CSP 준수
- Inline script 없음
- `eval()` 사용 금지

## 11. 브라우저 호환성

- **Chrome**: 88+ (Manifest V3 지원)
- **Edge**: 88+ (Chromium 기반)
- **Opera**: 미지원 (테스트 필요)
- **Firefox**: 미지원 (Manifest V2만 지원)