import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DEFAULT_ORCHESTRATION_PROMPT_TEMPLATE, DEFAULT_PROMPT_TEMPLATE, } from "./etc/prompt";

const foundationModelId = process.env.FOUNDATION_MODEL_ID!;
const knowledgeBaseId = process.env.KNOWLEDGE_BASE_ID!;

const client = new BedrockAgentRuntimeClient({});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  console.debug(event)
  try {
    const eventParse = JSON.parse(event.body || "\"q\": \"\"");
    const query = eventParse.q || ""
    console.debug(`query: ${query}`)
    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Query parameter 'q' is required." }),
      };
    }

    const command = new RetrieveAndGenerateCommand({
      input: { text: query },
      retrieveAndGenerateConfiguration: {
        type: "KNOWLEDGE_BASE",
        knowledgeBaseConfiguration: {
          modelArn:  foundationModelId,
          knowledgeBaseId: knowledgeBaseId,
          generationConfiguration: {
            promptTemplate: {
              textPromptTemplate: DEFAULT_PROMPT_TEMPLATE
            },
          },
          orchestrationConfiguration: {
            promptTemplate: {
              textPromptTemplate: DEFAULT_ORCHESTRATION_PROMPT_TEMPLATE,
            },
          }
        },
      },
    });

    const response = await client.send(command);
    console.debug(JSON.stringify(response))

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: response.output?.text ?? "回答を生成できませんでした。"
      }),
    };
  } catch (error: any) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error", error: error.message }),
    };
  }
};
