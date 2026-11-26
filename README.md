# MyPR

MyPR — Presentation Represented by Myself. 나를 표현하는 카드를 만들고 모아 공유하는 웹앱이에요.

## 화면
- **처음 화면**: 프로필 사진, 이름, 한 줄 소개, 소셜 링크 아이콘. 아래쪽에 MY CARDS 카드 덱이 보여요.
- **MY CARD**: 카드 영역을 위로 올리면 전체화면이 되고, 프로필 사진이 오른쪽 위로 이동해요.
- **CREATE MYPR CARD**: + 버튼을 누르고 사이트 주소를 넣으면 카드가 만들어져요.

## 개발
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 에 배포용 파일 생성
```

## 로그인 (Supabase)
`src/lib/supabase.ts`에 Supabase 프로젝트 주소와 publishable 키가 들어 있어요.
다른 프로젝트를 쓰려면 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 환경변수를 설정하세요.
secret 키는 절대 코드나 환경변수에 넣지 마세요.

## 배포
Vercel이 이 저장소의 `main` 브랜치를 실제 사이트로 배포해요.
