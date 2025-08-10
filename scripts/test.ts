require('dotenv').config();

const queryApi = async () => {
    try {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        const body = {
            q: "AWSをこれから使い始めます。まずはどの資格から取得するのがいいですか？",
        };
        const response = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(`HTTP ${response.status} ${response.statusText} ${text}`);
        }
        const data = (await response.json()) ;
        console.log("✅ API response:");
        console.log(JSON.stringify(data, null, 2));
    } catch (err: any) {
        console.error("❌ Failed to execute API:", err.message);
        process.exit(1);
    }
}

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


const prjName = process.env.PROJECT_NAME;
if (!prjName) {
    console.error("PROJECT_NAME is not defined in .env");
    process.exit(1);
}

const outputs = getStackOutput()
const endpoint = outputs!.filter((o) => o.OutputKey === 'ApiEndpoint')[0].OutputValue || ''

queryApi()