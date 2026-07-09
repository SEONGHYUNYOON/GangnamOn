import { BUCKET_ID, ID, Permission, Role, databases, DATABASE_ID, COLLECTIONS, storage, getFileUrl, callEconomy } from './appwrite';

const canvasToBlob = (canvas, type, quality) => new Promise((resolve) => {
     canvas.toBlob(resolve, type, quality);
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

     const blob = await canvasToBlob(canvas, 'image/webp', 0.82);
     return new File([blob], `avatar-${Date.now()}.webp`, { type: 'image/webp' });
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
