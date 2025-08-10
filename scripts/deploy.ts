require('dotenv').config();

const cfnDeploy = () => {
  try {
    // バケットの存在確認
    require('child_process').execSync(
      `aws cloudformation deploy --template-file cfn/template.yaml --stack-name ${prjName}-Stack --parameter-overrides Prefix=${prjName} LambdaSourceBucketName=${lambdaSourceBucket} LambdaSourceKey=${souceKey} KnowledgeBaseBucketName=${docBucket} KnowledgeBasePrefix=${docPrefix} EmbeddingModel=${embeddingModel} AvailabilityZoneCount=${azCount} OpenSearchServerlessMultiAZMode=${openSearchFlg} LogRetentionInDays=${logRretentionDays} SetupUserArn=${SetupUserArn} --capabilities CAPABILITY_NAMED_IAM`,
      { stdio: 'inherit' }
    );
    console.log(`✅ Stack created: ${prjName}Stack `);
  } catch (err: any) {
    console.error("❌ Failed to aws cloudformation deploy:", err.message);
    process.exit(1);
  }
}

const cfnDescribe = () => {
  try {
    // スタックのアウトプット取得処理
    const raw = require('child_process').execSync(
      `aws cloudformation describe-stacks --stack-name ${prjName}-Stack --query "Stacks[0].Outputs"  --output json`,
      { encoding: "utf-8" }
    );
    const outputs: Array<{
      OutputKey: string;
      OutputValue?: string;
      Description?: string;
      ExportName?: string;
    }> = JSON.parse(raw) ?? [];

    if (!outputs.length) {
      console.log("ℹ️ No Outputs found.");
    } else {
      console.log("\n📤 CloudFormation Outputs");
      console.log("──────────────────────────");
      for (const o of outputs) {
        const desc = o.Description ? `  // ${o.Description}` : "";
        console.log(`• ${o.OutputKey}: ${o.OutputValue ?? ""}${desc}`);
      }
      console.log("──────────────────────────\n");
    }
    
  } catch (err: any) {
    console.error("❌ Failed to aws cloudformation describe-stacks:", err.message);
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

const docBucket = process.env.MANUAL_BUCKET;
if (!docBucket) {
    console.error("MANUAL_BUCKET is not defined in .env");
    process.exit(1);
}

const docPrefix = process.env.KNOWLEDGEBASE_PREFIX;
if (!docPrefix) {
    console.error("KNOWLEDGEBASE_PREFIX is not defined in .env");
    process.exit(1);
}

const embeddingModel = process.env.EMBEDDING_MODEL
if (!embeddingModel) {
  console.error("EMBEDDING_MODEL is not defined in .env");
  process.exit(1);
}

const azCount = process.env.AZCOUNT;
if (!azCount) {
    console.error("AZCOUNT is not defined in .env");
    process.exit(1);
}

const openSearchFlg = process.env.OPENSEARCH_SERVERLESS_MAZMODE;
if (!openSearchFlg) {
    console.error("OPENSEARCH_SERVERLESS_MAZMODE is not defined in .env");
    process.exit(1);
}

const logRretentionDays = process.env.LOGRETENTION_DAYS;
if (!logRretentionDays) {
    console.error("LOGRETATION_DAYS is not defined in .env");
    process.exit(1);
}

const SetupUserArn = process.env.SETUPUSER_IAM_RESOURCE_ARN;
if (!SetupUserArn) {
    console.error("SETUPUSER_IAM_RESOURCE_ARN is not defined in .env");
    process.exit(1);
}

cfnDeploy()
cfnDescribe()