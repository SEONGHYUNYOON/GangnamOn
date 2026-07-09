# Cursor AI 에이전트용 프롬프트 (프로필 사진 업로드 — 진짜 원인 발견: DB 스키마 누락)

이전에 배포했던 프로필 사진 업로드 수정(webp→png 폴백, 에러 메시지 노출)
덕분에 실제 에러 메시지를 정확히 볼 수 있게 됐고, 그 메시지로 진짜 원인을
찾았습니다.

## 에러 메시지

```
프로필 사진 업로드에 실패했습니다.
(Invalid document structure: Unknown attribute: "avatarUrl")
```

## 원인

`appwrite.json`(설계도)에는 `profiles` 컬렉션에 `avatarUrl` 속성이
정의돼 있지만 (string, size 512, required: false), **실제 라이브
Appwrite 데이터베이스의 profiles 컬렉션에는 이 속성이 생성된 적이
없습니다.** 그래서 코드가 아무리 정확해도 avatarUrl 값을 저장하려는
모든 시도(client 직접 업데이트 + economy Function의 update_avatar
폴백까지 전부)가 "그런 속성 없음" 에러로 실패하고 있었던 거예요.

이번 요청은 코드 변경이 아니라 **라이브 데이터베이스에 속성 하나를
추가하는 것**뿐입니다.

## 프롬프트 (복사해서 붙여넣기)

```
GangnamOn 프로젝트(D:\DEV\GangNam_On)에서 프로필 사진 업로드가 계속
"Unknown attribute: avatarUrl" 에러로 실패하고 있어. 확인해보니
appwrite.json에는 profiles 컬렉션에 avatarUrl 속성이 정의돼 있는데
실제 라이브 데이터베이스에는 이 속성이 생성되어 있지 않아. 딱 이
속성 하나만 라이브 profiles 컬렉션에 추가해줘.

appwrite push collections --all --force는 기존 컬렉션을 통째로
재생성할 위험이 있어서 절대 쓰면 안 돼. 대신 Node SDK로 이 속성 하나만
좁혀서 추가해줘 (appwrite.json에 정의된 스펙과 동일하게):

```js
await databases.createStringAttribute(DATABASE_ID, 'profiles', 'avatarUrl', 512, false);
```

속성 생성 직후에는 반영까지 몇 초 걸릴 수 있으니 잠깐 대기한 다음,
Appwrite 콘솔 > Databases > main > profiles > Attributes 탭에서
avatarUrl이 "available" 상태로 보이는지 확인해줘.

그 다음 확인해줘:
- 벨기에쪼꼬렛 계정(또는 아무 테스트 계정)으로 로그인해서 미니홈피 >
  프로필 사진 변경을 시도했을 때 더 이상 에러 없이 성공하는지
- 성공하면 새로고침해도 바뀐 사진이 유지되는지

이번엔 코드 변경이 없어서 git commit/push나 Function 재배포는 필요
없어. 데이터베이스 속성 추가만 하면 돼. 결과 알려줘.
```
