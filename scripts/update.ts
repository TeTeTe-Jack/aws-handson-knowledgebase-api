require('dotenv').config();

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

const prjName = process.env.PROJECT_NAME;
if (!prjName) {
    console.error("PROJECT_NAME is not defined in .env");
    process.exit(1);
}

const lambdaSourceBucket = process.env.DEPLOY_BUCKET;
if (!lambdaSourceBucket) {
    console.error("DEPLOY_BUCKET is not defined in .env");
    process.exit(1);
}

const souceKey = process.env.LAMBDA_SOURCE_ZIP_KEY;
if (!souceKey) {
    console.error("LAMBDA_SOURCE_ZIP_KEY is not defined in .env");
    process.exit(1);
}

updateLambdaCode()