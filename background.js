// Google Translate API를 사용한 번역 함수
async function translateText(text, targetLang, sourceLang = 'auto') {
  try {
    // Google Translate API 무료 엔드포인트 사용
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Translation request failed');
    }

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
  } catch (error) {
    console.error('Translation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 대체 번역 API (MyMemory)
async function translateWithMyMemory(text, targetLang, sourceLang = 'auto') {
  try {
    const langPair = sourceLang === 'auto' ? `autodetect|${targetLang}` : `${sourceLang}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData) {
      return {
        success: true,
        translatedText: data.responseData.translatedText,
        detectedLanguage: sourceLang
      };
    } else {
      throw new Error('MyMemory translation failed');
    }
  } catch (error) {
    console.error('MyMemory translation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// LibreTranslate API 사용 (옵션)
async function translateWithLibre(text, targetLang, sourceLang = 'auto') {
  try {
    const url = 'https://libretranslate.de/translate';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      })
    });

    const data = await response.json();

    if (data.translatedText) {
      return {
        success: true,
        translatedText: data.translatedText,
        detectedLanguage: sourceLang
      };
    } else {
      throw new Error('LibreTranslate translation failed');
    }
  } catch (error) {
    console.error('LibreTranslate error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 언어 코드 변환 (필요시)
function convertLanguageCode(lang) {
  const langMap = {
    'ko': 'ko',
    'en': 'en',
    'ja': 'ja',
    'zh': 'zh-CN',
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-TW',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'ru': 'ru',
    'ar': 'ar',
    'pt': 'pt',
    'it': 'it',
    'vi': 'vi',
    'th': 'th',
    'id': 'id',
    'hi': 'hi'
  };

  return langMap[lang] || lang;
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    const targetLang = convertLanguageCode(request.targetLang);
    const sourceLang = request.sourceLang || 'auto';

    // 번역 시도 (Google Translate -> MyMemory -> LibreTranslate 순서)
    (async () => {
      try {
        // Google Translate 시도
        let result = await translateText(request.text, targetLang, sourceLang);

        if (result.success) {
          sendResponse(result);
          return;
        }

        // Google 실패 시 MyMemory 시도
        result = await translateWithMyMemory(request.text, targetLang, sourceLang);

        if (result.success) {
          sendResponse(result);
          return;
        }

        // MyMemory 실패 시 LibreTranslate 시도
        result = await translateWithLibre(request.text, targetLang, sourceLang);

        if (result.success) {
          sendResponse(result);
          return;
        }

        // 모든 방법 실패
        sendResponse({
          success: false,
          error: 'All translation services failed'
        });
      } catch (error) {
        console.error('Translation error:', error);
        sendResponse({
          success: false,
          error: error.message || 'Translation failed'
        });
      }
    })();

    // 비동기 응답을 위해 true 반환
    return true;
  }

  if (request.action === 'detectLanguage') {
    // 언어 감지 요청 처리
    translateText(request.text, 'en', 'auto')
      .then(result => {
        sendResponse({
          success: true,
          detectedLanguage: result.detectedLanguage
        });
      })
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message
        });
      });

    return true;
  }
});

// 확장 프로그램 설치/업데이트 시
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('텍스트 번역기가 설치되었습니다.');

    // 기본 설정 저장
    chrome.storage.sync.set({
      defaultTargetLang: 'ko',
      autoDetect: true,
      showAllTranslations: false
    });
  } else if (details.reason === 'update') {
    console.log('텍스트 번역기가 업데이트되었습니다.');
  }
});
