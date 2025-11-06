import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://t3.storage.dev`,
  credentials: {
    accessKeyId: process.env.TIGRIS_STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.TIGRIS_STORAGE_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: false,
});

export const uploadImageAssets = async (buffer: Buffer, key: string) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.TIGRIS_STORAGE_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: "image/*",
      ACL: "public-read", // optional if bucket is public
    })
  );

  const publicUrl = `https://nextjs-starter-images.t3.storage.dev/${key}`;
  return publicUrl;
};
