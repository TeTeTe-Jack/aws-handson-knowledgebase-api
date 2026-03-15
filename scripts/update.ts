import { requireParam } from './params';

const updateLambdaCode = () => {
  try {
    // Lambda関数の更新
    const raw = require('child_process').execSync(
      `aws lambda update-function-code --function-name ${prjName}-handler --s3-bucket ${lambdaSourceBucket} --s3-key ${souceKey} --publish --output json`,
      { encoding: "utf-8" }
    );
    console.log(`✅ aws lambda update-function-code is succeeded `);
  } catch (err: any) {
    console.error("❌ Failed to aws lambda update-function-code:", err.message);
    process.exit(1);
  }
}

const prjName = requireParam('Prefix');
const lambdaSourceBucket = requireParam('LambdaSourceBucketName');
const souceKey = requireParam('LambdaSourceKey');

updateLambdaCode();