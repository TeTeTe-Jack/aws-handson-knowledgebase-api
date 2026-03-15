import { requireParam } from './params';

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getStackOutput = () => {
  try {
    // スタックの出力を取得
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
      return outputs
    }
    
  } catch (err: any) {
    console.error("❌ Failed to aws cloudformation describe-stacks:", err.message);
    process.exit(1);
  }
}

const syncKnowledgeBase = (kbId: string, dsId: string) => {
  try {
    // ナレッジベースの同期処理
    const result = require('child_process').execSync(
      `aws bedrock-agent start-ingestion-job --data-source-id ${dsId} --knowledge-base-id ${kbId} --output json`,
      { encoding: "utf-8" }
    );
    const resultParse = JSON.parse(result)
    console.log(`✅ aws bedrock-agent start-ingestion-job is succeeded `);
    return resultParse.ingestionJob.ingestionJobId
  } catch (err: any) {
    console.error("❌ Failed to aws bedrock-agent start-ingestion-job:", err.message);
    process.exit(1);
  }
}

const prjName = requireParam('Prefix');

const outputs = getStackOutput()
const kbId = outputs!.filter((o) => o.OutputKey === 'KnowledgeBaseId')[0].OutputValue
const dsid = outputs!.filter((o) => o.OutputKey === 'DataSourceId')[0].OutputValue

if (!kbId){
    console.error("KnowledgeBaseId is not defined in Cfn.Outputs");
    process.exit(1);
}

if (!dsid){
    console.error("DataSourceId is not defined in Cfn.Outputs");
    process.exit(1);
}

const ijId = syncKnowledgeBase(kbId, dsid)  
