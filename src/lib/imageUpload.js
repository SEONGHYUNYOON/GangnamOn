import { BUCKET_ID, ID, Permission, Role, databases, DATABASE_ID, COLLECTIONS, storage, getFileUrl, callEconomy } from './appwrite';

const ALLOWED_UPLOAD_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

// canvas.toBlob은 지원하지 않는 포맷(특히 일부 구형 브라우저의 webp)에 대해
// 에러를 던지지 않고 조용히 null을 콜백에 넘깁니다. 그대로 두면 new File([null], ...)
// 로 4바이트짜리 깨진 파일이 만들어지고, 업로드 자체는 "성공"한 것처럼 진행되다가
// Appwrite가 그 내용물을 거부하면서 원인을 알 수 없는 업로드 실패로 이어집니다.
// 여기서 null을 명시적으로 reject해서, 아래 resizeImageFile이 webp 실패를
// 제대로 감지하고 png로 재시도할 수 있게 합니다.
const canvasToBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
     canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error(`캔버스에서 ${type} 형식으로 변환하지 못했습니다.`));
     }, type, quality);
});

export const resizeImageFile = async (file, maxSize = 512) => {
     const imageUrl = URL.createObjectURL(file);
     const image = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = imageUrl;
     });

     const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
     const width = Math.max(1, Math.round(image.width * scale));
     const height = Math.max(1, Math.round(image.height * scale));

     const canvas = document.createElement('canvas');
     canvas.width = width;
     canvas.height = height;
     const context = canvas.getContext('2d');
     context.drawImage(image, 0, 0, width, height);
     URL.revokeObjectURL(imageUrl);

     // webp 인코딩을 지원하지 않는 브라우저(일부 구형 Safari 등)를 위해,
     // webp가 실패하면 모든 브라우저가 지원하는 png로 한 번 더 시도합니다.
     try {
          const blob = await canvasToBlob(canvas, 'image/webp', 0.82);
          return new File([blob], `avatar-${Date.now()}.webp`, { type: 'image/webp' });
     } catch (webpError) {
          console.warn('webp 인코딩 실패, png로 재시도합니다:', webpError);
          const blob = await canvasToBlob(canvas, 'image/png', 0.92);
          return new File([blob], `avatar-${Date.now()}.png`, { type: 'image/png' });
     }
};

export const uploadProfileAvatar = async (userId, file) => {
     if (!userId || !file) throw new Error('로그인이 필요합니다.');

     // 일부 기기(특히 iPhone 카메라의 HEIC 사진)는 canvas로 리사이즈할 때
     // 디코딩에 실패할 수 있습니다. 리사이즈가 실패해도 원본 파일로 업로드를
     // 계속 시도합니다 (완전히 실패해서 알림이 뜨는 것보다 낫습니다).
     let resized;
     try {
          resized = await resizeImageFile(file);
     } catch (resizeError) {
          console.warn('이미지 리사이즈 실패, 원본 파일로 업로드를 시도합니다:', resizeError);
          // 원본 파일이 버킷 허용 확장자(jpg/jpeg/png/webp)가 아니면 업로드 자체가
          // 거부될 게 뻔하므로, 미리 걸러서 명확한 에러 메시지를 보여줍니다
          // (예: iPhone에서 바로 찍은 HEIC 사진).
          const ext = (file.name || '').split('.').pop()?.toLowerCase();
          if (!ext || !ALLOWED_UPLOAD_EXTENSIONS.includes(ext)) {
               throw new Error('지원하지 않는 이미지 형식이에요. jpg, png, webp 파일로 다시 시도해주세요.');
          }
          resized = file;
     }

     // post-images 버킷은 File Security가 꺼져 있어(fileSecurity: false),
     // 파일별 커스텀 권한을 지정하면 Appwrite가 요청을 거부할 수 있습니다.
     // 먼저 권한을 지정해서 시도하고, 실패하면 권한 없이 재시도합니다.
     let uploaded;
     try {
          uploaded = await storage.createFile({
               bucketId: BUCKET_ID,
               fileId: ID.unique(),
               file: resized,
               permissions: [
                    Permission.read(Role.any()),
                    Permission.update(Role.user(userId)),
                    Permission.delete(Role.user(userId)),
               ],
          });
     } catch (permissionError) {
          console.warn('권한 지정 업로드 실패, 권한 없이 재시도합니다:', permissionError);
          uploaded = await storage.createFile({
               bucketId: BUCKET_ID,
               fileId: ID.unique(),
               file: resized,
          });
     }

     const avatarUrl = getFileUrl(uploaded.$id);

     try {
          await databases.updateDocument({
               databaseId: DATABASE_ID,
               collectionId: COLLECTIONS.profiles,
               documentId: userId,
               data: { avatarUrl },
          });
     } catch (updateError) {
          // 오래된 계정은 profiles 문서에 update 권한이 없을 수 있습니다.
          // 서버 권한(API 키)을 가진 economy Function을 통해 한 번 더 시도합니다.
          console.warn('프로필 문서 직접 업데이트 실패, economy Function으로 재시도합니다:', updateError);
          const fallback = await callEconomy({ action: 'update_avatar', avatarUrl });
          if (!fallback.success) throw updateError;
     }

     return avatarUrl;
};

export const uploadPostImage = async (file, maxSize = 1200) => {
     if (!file) throw new Error('이미지 파일이 필요합니다.');

     const resized = await resizeImageFile(file, maxSize);
     const uploaded = await storage.createFile({
          bucketId: BUCKET_ID,
          fileId: ID.unique(),
          file: resized,
          permissions: [Permission.read(Role.any())],
     });

     return getFileUrl(uploaded.$id);
};
