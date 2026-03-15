import { requireParam, getAllParams } from './params';

const cfnDeploy = () => {
  try {
    // バケットの存在確認
    require('child_process').execSync(
      `aws cloudformation deploy --template-file cfn/template.yaml --stack-name ${prjName}-Stack --parameter-overrides ${getAllParams().map(p => `${p.ParameterKey}=${p.ParameterValue}`).join(' ')} --capabilities CAPABILITY_NAMED_IAM`,
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

const prjName = requireParam('Prefix');

cfnDeploy();
cfnDescribe();