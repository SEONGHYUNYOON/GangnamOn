# 강남온 PWA 가이드

## 추가된 기능

- **홈 화면에 추가**: 모바일 브라우저에서 "홈 화면에 추가" 시 앱처럼 설치
- **전체 화면 실행**: 브라우저 UI 없이 앱처럼 실행
- **테마 색상**: 주소창/상태바 색상 통일 (보라색 #7c3aed)

---

## PC에서 테스트

1. 빌드: `npm run build`
2. 프리뷰: `npm run preview`
3. 브라우저에서 `http://localhost:4173` 접속
4. Chrome 개발자도구 (F12) → **Application** 탭 → **Manifest**에서 설정 확인

---

## 모바일에서 테스트 (실제 PWA 설치)

1. **Vercel 등에 배포** 후 HTTPS URL로 접속
2. **모바일 Chrome**에서 해당 URL 접속
3. 메뉴(⋮) → **"홈 화면에 추가"** 또는 **"앱 설치"** 선택
4. 홈 화면에 강남온 아이콘이 생성됨
5. 아이콘 탭 시 전체 화면으로 앱처럼 실행

> ⚠️ **로컬(localhost)**에서는 "홈 화면에 추가"가 제한될 수 있습니다. **HTTPS로 배포된 URL**에서 테스트하는 것이 좋습니다.

---

## 추가/수정된 파일

| 파일 | 설명 |
|------|------|
| `public/manifest.webmanifest` | PWA 앱 정보 (이름, 아이콘, 테마색) |
| `public/sw.js` | 서비스 워커 (설치 요건 충족) |
| `public/icon.svg` | 앱 아이콘 |
| `index.html` | manifest 링크, 메타 태그 |
| `src/main.jsx` | 서비스 워커 등록 |

---

## 아이콘 변경

`public/icon.svg` 파일을 수정하거나, `public/icon-192.png`, `public/icon-512.png` PNG 파일을 추가한 뒤 `manifest.webmanifest`의 icons 항목을 수정하면 됩니다.
