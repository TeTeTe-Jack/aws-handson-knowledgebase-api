require('dotenv').config();

const uploadZipFile = (bucketName: string, key: string) => {
    try {
        // バケットの存在確認
        require('child_process').execSync(`aws s3 ls s3://${bucketName}`, { stdio: 'ignore' });
        console.log(`✅ S3 bucket exists: s3://${bucketName}`);
        require('child_process').execSync(`aws s3 cp lambda/kb-api.zip s3://${bucketName}/${key}`, { stdio: 'inherit' });
        console.log(`✅ Zip file is uploaded: s3://${bucketName}/${key}`);
    } catch (err: any) {
        console.error("❌ Failed to create bucket:", err.message);
        process.exit(1);
    }
}

const uploadBucket = process.env.DEPLOY_BUCKET;
const uploadObject = process.env.LAMBDA_SOURCE_ZIP_KEY;

if (!uploadBucket) {
    console.error("S3_BUCKET_FOR_LAMBDA is not defined in .env");
    process.exit(1);
}

if (!uploadObject) {
    console.error("LAMBDA_SOURCE_ZIP_KEY is not defined in .env");
    process.exit(1);
}

uploadZipFile(uploadBucket, uploadObject)