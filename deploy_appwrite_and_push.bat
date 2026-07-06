@echo off
cd /d "%~dp0"

echo ============================================
echo  1/3  Appwrite CLI 설치 확인
echo ============================================
call npm install -g appwrite-cli

echo.
echo ============================================
echo  2/3  Appwrite 로그인 (브라우저가 열립니다)
echo ============================================
call appwrite login

echo.
echo ============================================
echo  3/3  Appwrite에 실제 DB 구조(테이블/버킷) 생성
echo ============================================
call appwrite push collections --all

echo.
echo ============================================
echo  Git 커밋 + 푸시 (Vercel 자동 배포 트리거)
echo ============================================
call git add -A
call git commit -m "Migrate backend from Supabase to Appwrite"
call git push

echo.
echo ============================================
echo  완료! 잠시 후 Vercel 대시보드에서 배포 상태를 확인하세요.
echo ============================================
pause
