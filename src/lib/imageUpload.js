import { BUCKET_ID, ID, Permission, Role, databases, DATABASE_ID, COLLECTIONS, storage, getFileUrl } from './appwrite';

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

     const resized = await resizeImageFile(file);
     const uploaded = await storage.createFile({
          bucketId: BUCKET_ID,
          fileId: ID.unique(),
          file: resized,
          permissions: [
               Permission.read(Role.any()),
               Permission.update(Role.user(userId)),
               Permission.delete(Role.user(userId)),
          ],
     });

     const avatarUrl = getFileUrl(uploaded.$id);
     await databases.updateDocument({
          databaseId: DATABASE_ID,
          collectionId: COLLECTIONS.profiles,
          documentId: userId,
          data: { avatarUrl },
     });

     return avatarUrl;
};
