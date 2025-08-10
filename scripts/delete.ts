require('dotenv').config();

const cfnDelete = () => {
  try {
    // スタック削除
    require('child_process').execSync(
      `aws cloudformation delete-stack --stack-name ${prjName}-Stack`,
      { stdio: 'inherit' }
    );
    console.log(`✅ aws cloudformation delete-stack is succeeded`);
  } catch (err: any) {
    console.error("❌ Failed to aws cloudformation delete-stack:", err.message);
    process.exit(1);
  }
}

const prjName = process.env.PROJECT_NAME;
if (!prjName) {
    console.error("PROJECT_NAME is not defined in .env");
    process.exit(1);
}

cfnDelete()