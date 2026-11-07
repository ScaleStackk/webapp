import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getConnectionConfig } from "./connectionConfig";

let cachedClient;

function getS3Client() {
  if (cachedClient) return cachedClient;
  const { aws } = getConnectionConfig();
  cachedClient = new S3Client({
    region: aws.region,
    ...(aws.credentials ? { credentials: aws.credentials } : {}),
    ...(aws.s3.endpoint ? { endpoint: aws.s3.endpoint } : {}),
    forcePathStyle: aws.s3.forcePathStyle,
  });
  return cachedClient;
}

export async function uploadJudgmentPdf({ body, documentId, originalFilename }) {
  const { aws } = getConnectionConfig();
  const prefix = aws.s3.prefix.replace(/^\/+|\/+$/g, "");
  const key = `${prefix}/${documentId}/source.pdf`;
  const encryption = aws.s3.serverSideEncryption;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: aws.s3.bucket,
      Key: key,
      Body: body,
      ContentLength: body.length,
      ContentType: "application/pdf",
      Metadata: {
        "document-id": documentId,
        "original-filename": encodeURIComponent(originalFilename).slice(0, 900),
      },
      ...(encryption ? { ServerSideEncryption: encryption } : {}),
      ...(encryption === "aws:kms" && aws.s3.kmsKeyId
        ? { SSEKMSKeyId: aws.s3.kmsKeyId }
        : {}),
    }),
  );

  return {
    bucket: aws.s3.bucket,
    key,
    uri: `s3://${aws.s3.bucket}/${key}`,
  };
}
