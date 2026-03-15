import { requireParam } from './params';

const logCommandError = (label: string, err: any) => {
    console.error(`❌ ${label}`);
    console.error(`message: ${err?.message ?? 'unknown error'}`);
    if (typeof err?.status !== 'undefined') {
        console.error(`exitCode: ${err.status}`);
    }
    const stderr = err?.stderr ? String(err.stderr).trim() : '';
    const stdout = err?.stdout ? String(err.stdout).trim() : '';
    if (stderr) {
        console.error(`stderr: ${stderr}`);
    }
    if (stdout) {
        console.error(`stdout: ${stdout}`);
    }
};

const uploadZipFile = (bucketName: string, key: string) => {
    try {
        // バケットの存在確認
        require('child_process').execSync(`aws s3 ls s3://${bucketName}`, {
            stdio: 'pipe',
            encoding: 'utf-8'
        });
        console.log(`✅ S3 bucket exists: s3://${bucketName}`);
        require('child_process').execSync(`aws s3 cp lambda/kb-api.zip s3://${bucketName}/${key}`, { stdio: 'inherit' });
        console.log(`✅ Zip file is uploaded: s3://${bucketName}/${key}`);
    } catch (err: any) {
        logCommandError('Failed to upload zip to S3.', err);
        console.error('hint: LambdaSourceBucketName の存在、アクセス権限（s3:ListBucket / s3:PutObject）、AWS認証情報を確認してください。');
        process.exit(1);
    }
}

const uploadBucket = requireParam('LambdaSourceBucketName');
const uploadObject = requireParam('LambdaSourceKey');

uploadZipFile(uploadBucket, uploadObject);