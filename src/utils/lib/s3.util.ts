import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import logger from "../classes/Logger";
import { SecretsManager } from "../classes/SecretsManager";

const awsSecrets = SecretsManager.getInstance().getAWSSecrets();
const awsConfiguration = {
    accessKeyId: awsSecrets.S3_ACCESS_KEY,
    secretAccessKey: awsSecrets.S3_SECRET_ACCESS_KEY,
    region: awsSecrets.S3_REGION,
    bucketName: awsSecrets.S3_BUCKET_NAME
}

const client = new S3Client({
    region: awsConfiguration.region,
    credentials: {
        accessKeyId: awsConfiguration.accessKeyId,
        secretAccessKey: awsConfiguration.secretAccessKey
    }
});

export const uploadToS3 = async (file: Buffer, fileName: string) => {
    try {
        const uploadCommand = new PutObjectCommand({
            Bucket: awsConfiguration.bucketName,
            Key: fileName,
            Body: file,
            ContentType: "application/pdf",
            StorageClass: "STANDARD_IA",
        });

        const respUpload = await client.send(uploadCommand)

        return respUpload.ETag

    } catch (error) {
        logger.error(error as string);
    }
}

export const getFileInS3 = async (fileName: string) => {
    try {
        const getCommand = new GetObjectCommand({
            Bucket: awsConfiguration.bucketName,
            Key: fileName,
        });
        const signedUrl = await getSignedUrl(client, getCommand, { expiresIn: 3600 });
        return signedUrl;
    } catch (error) {
        logger.error(error as string);
    }
}