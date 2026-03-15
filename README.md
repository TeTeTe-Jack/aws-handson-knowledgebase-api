# AWS ハンズオン：Knowledge Base API セットアップ

このプロジェクトは、Amazon Bedrock Knowledge Base を活用した API サービスのハンズオン用リポジトリです。  
API Gateway、Lambda、S3、OpenSearch Service などを連携し、ナレッジベース検索を実装します。
紹介記事：[RAG構成で実現！Bedrockナレッジベースを活用した生成AI APIの作り方 -CloudFormationテンプレート付き-](https://tetete-home.com/article/1250)

---

## 📦 前提条件

- Node.js 24.x
- AWS アカウントおよび IAM 権限（[IAM権限サンプル cfn/iam-policy.json](cfn/iam-policy.json)）
- AWS CLI セットアップ済み
- `cfn/parameters.json` を編集してデプロイパラメータを設定（詳細は後述）
- 以下のS3バケットが作成済み
  - LambdaSourceBucketName（Lambda関数のソースを格納するバケット）
  - KnowledgeBaseBucketName（マニュアルを格納するバケット。ドキュメントが格納済み）

---

## 🗺️ 環境構成
![](./assets/aws.png)

---

## ☁️ CloudFormationで配備される主なリソース

| 論理ID | タイプ | 用途 | 関連パラメータ |
|---|---|---|---|
| VPC | AWS::EC2::VPC | アプリ全体のネットワーク境界 | AvailabilityZoneCount |
| PrivateSubnet1/2/3 | AWS::EC2::Subnet | Lambda / VPC Endpoint 用プライベートサブネット | AvailabilityZoneCount |
| PrivateRouteTable1/2/3 | AWS::EC2::RouteTable | プライベートサブネット用ルートテーブル | AvailabilityZoneCount |
| VPCEndpointS3 | AWS::EC2::VPCEndpoint | S3 への Gateway Endpoint | - |
| VPCEndpointBedrock | AWS::EC2::VPCEndpoint | Bedrock Agent Runtime への Interface Endpoint | - |
| EndpointSecurityGroup | AWS::EC2::SecurityGroup | VPC Endpoint 側の SG | - |
| LambdaSecurityGroup | AWS::EC2::SecurityGroup | Lambda 側の SG | - |
| LambdaExecutionRole | AWS::IAM::Role | メイン Lambda 実行ロール | - |
| BedrockExecutionRole | AWS::IAM::Role | Knowledge Base 実行ロール | EmbeddingModel |
| WaitFnRole | AWS::IAM::Role | インデックス待機 Lambda 用ロール | - |
| OpenSearchCollection | AWS::OpenSearchServerless::Collection | ベクトル検索用コレクション | OpenSearchServerlessMultiAZMode |
| OpenSearchIndex | AWS::OpenSearchServerless::Index | ベクトルインデックス（`knn_vector`） | EmbeddingModel（次元整合） |
| OpenSearchAccessPolicy | AWS::OpenSearchServerless::AccessPolicy | Bedrock実行ロール向けアクセス制御 | - |
| OpenSearchEncryptionPolicy | AWS::OpenSearchServerless::SecurityPolicy | コレクション暗号化設定 | - |
| OpenSearchNetworkPolicy | AWS::OpenSearchServerless::SecurityPolicy | ネットワーク公開設定 | - |
| WaitForIndexReady | AWS::CloudFormation::CustomResource | OpenSearch インデックス準備待ち。CloudFormationと実際の作成完了のタイミング異なるため、一定期間待機する処理を追加。 | - |
| KnowledgeBase | AWS::Bedrock::KnowledgeBase | Bedrock Knowledge Base 本体 | EmbeddingModel |
| KnowledgeBaseDataSource | AWS::Bedrock::DataSource | S3 データソース設定 | KnowledgeBaseBucketName / KnowledgeBasePrefix |
| LambdaFunction | AWS::Lambda::Function | API 本体（RetrieveAndGenerate 実行） | LambdaSourceBucketName / LambdaSourceKey |
| LambdaLogGroup | AWS::Logs::LogGroup | Lambda ログ保持先 | LogRetentionInDays |
| HttpApi | AWS::ApiGatewayV2::Api | 公開 HTTP API | - |
| ApiIntegration | AWS::ApiGatewayV2::Integration | API Gateway → Lambda 連携 | - |
| ApiRoute | AWS::ApiGatewayV2::Route | `POST /search` ルート | - |
| ApiStage | AWS::ApiGatewayV2::Stage | `prod` ステージとアクセスログ設定 | LogRetentionInDays |
| ApiLogGroup | AWS::Logs::LogGroup | API Gateway アクセスログ保持先 | LogRetentionInDays |
| LambdaInvokePermission | AWS::Lambda::Permission | API Gateway から Lambda 呼び出し許可 | - |

---

## 📁 ディレクトリ構成
```bash
aws-handson-kb-api/
├── scripts/            # セットアップや補助スクリプト
├── lambda/             # Lambda 関数などのソースコード
├── cfn/                # CloudFormation（CFn） テンプレート類
│   ├── template.yaml
│   └── parameters.json # デプロイパラメータ（手動編集）
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md

```

---

## 🛠️ セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/TeTeTe-Jack/aws-handson-knowledgebase-api.git
cd aws-handson-knowledgebase-api
```

### 2. `cfn/parameters.json` を編集
`cfn/parameters.json.template` を開き、環境に合わせて `ParameterValue` を編集してください。
編集後、`cfn/parameters.json` というファイル名で保存してください。

#### 利用パラメタ一覧
| ParameterKey | 必須 | 説明 | 例 | 備考 |
|---|---|---|---|---|
| Prefix | 必須 | リソース名のプレフィックス | `my-kb-project` | スタック名は `${Prefix}-Stack` になります |
| LambdaSourceBucketName | 必須 | Lambda ZIP を配置する S3 バケット名 | `my-kb-deploy-bucket` | 事前作成が必要 |
| LambdaSourceKey | 必須 | Lambda ZIP のオブジェクトキー | `kb-api/kb-api.zip` | `npm run upload` でアップロード |
| KnowledgeBaseBucketName | 必須 | ナレッジドキュメント格納 S3 バケット名 | `my-kb-manual-bucket` | 事前作成が必要 |
| KnowledgeBasePrefix | 必須 | ナレッジドキュメントのプレフィックス | `manual/` | 末尾 `/` 推奨 |
| EmbeddingModel | 必須 | 埋め込みモデル ID | `amazon.titan-embed-text-v2:0` | 現在はこの値を想定 |
| GenerationModelIdOrInferenceProfile | 必須 | 回答生成に使う Bedrock 推論プロファイル ID | `global.anthropic.claude-haiku-4-5-20251001-v1:0` | ARN ではなく ID のみ指定。利用可能な値は `aws bedrock list-inference-profiles` で確認 |
| AvailabilityZoneCount | 必須 | 利用するプライベートサブネット数（AZ数） | `1` | `1`〜`3` |
| OpenSearchServerlessMultiAZMode | 必須 | OpenSearch Serverless の冗長化モード | `OFF` | `ON` / `OFF` |
| LogRetentionInDays | 必須 | CloudWatch Logs の保持日数 | `7` | `1` 以上 |


```json
[
    {
        "ParameterKey": "Prefix",
        "ParameterValue": "my-kb-project"
    },
    {
        "ParameterKey": "LambdaSourceBucketName",
        "ParameterValue": "my-kb-deploy-bucket"
    },
    {
        "ParameterKey": "LambdaSourceKey",
        "ParameterValue": "kb-api/kb-api.zip"
    },
    {
        "ParameterKey": "KnowledgeBaseBucketName",
        "ParameterValue": "my-kb-manual-bucket"
    },
    {
        "ParameterKey": "KnowledgeBasePrefix",
        "ParameterValue": "manual/"
    },
    {
        "ParameterKey": "EmbeddingModel",
        "ParameterValue": "amazon.titan-embed-text-v2:0"
    },
    {
        "ParameterKey": "GenerationModelIdOrInferenceProfile",
        "ParameterValue": "global.anthropic.claude-haiku-4-5-20251001-v1:0"
    },
    {
        "ParameterKey": "AvailabilityZoneCount",
        "ParameterValue": "1"
    },
    {
        "ParameterKey": "OpenSearchServerlessMultiAZMode",
        "ParameterValue": "OFF"
    },
    {
        "ParameterKey": "LogRetentionInDays",
        "ParameterValue": "7"
    }
]
```

- `LambdaSourceBucketName` と `KnowledgeBaseBucketName` は他と重複しないS3バケット名にしてください


### 3. 依存パッケージのインストール
```bash
npm install
```

### 4. ビルド・デプロイ・その他の操作
必要に応じて以下のコマンドを使用してください。
|コマンド|説明|
|---|---
|npm run build|TypeScript のビルド|
|npm run zip|TypeScript のビルド後にzip化|
|npm run upload|zip化したソースコードをS3にアップロード|
|npm run deploy|AWS へのデプロイ（CloudFormationでリソース配備）|
|npm run sync|Knowledge Baseの同期|
|npm run test|デプロイしたAPIのテスト|
|npm run update|Lambda関数のソースの最新化|
|npm run delete|デプロイした環境の削除|
