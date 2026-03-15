import * as fs from 'fs';
import * as path from 'path';

type CfnParam = { ParameterKey: string; ParameterValue: string };

const paramsFile = path.resolve(__dirname, '../cfn/parameters.json');
const params: CfnParam[] = JSON.parse(fs.readFileSync(paramsFile, 'utf-8'));

/** 必須パラメータを取得（未定義または空文字の場合はプロセスを終了） */
export const requireParam = (key: string): string => {
  const found = params.find(p => p.ParameterKey === key);
  if (!found || !found.ParameterValue) {
    console.error(`❌ ${key} is not defined in cfn/parameters.json`);
    process.exit(1);
  }
  return found.ParameterValue;
};

/** 任意パラメータを取得（未定義の場合は空文字を返す） */
export const getParam = (key: string): string => {
  return params.find(p => p.ParameterKey === key)?.ParameterValue ?? '';
};

/** 全パラメータを取得 */
export const getAllParams = (): CfnParam[] => params;
