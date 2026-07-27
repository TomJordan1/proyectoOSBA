import type { ConverseClient, ConverseInput, ConverseOutput } from "./bedrock-model-provider.js";

/**
 * Cliente real de Amazon Bedrock (Converse API). Import dinámico de la SDK
 * (especificador no-literal) para no requerir la SDK al compilar. En Lambda la
 * SDK v3 está disponible. NO se usa hasta BEDROCK_ENABLED=true + modelId (F0-03).
 */
export function makeBedrockConverseClient(region?: string): ConverseClient {
  const PKG: string = "@aws-sdk/client-bedrock-runtime";
  let clientP: Promise<any> | null = null;
  async function client(): Promise<any> {
    if (!clientP) {
      clientP = (async () => {
        const m: any = await import(PKG);
        return new m.BedrockRuntimeClient(region ? { region } : {});
      })();
    }
    return clientP;
  }
  return {
    async converse(input: ConverseInput): Promise<ConverseOutput> {
      const m: any = await import(PKG);
      const c = await client();
      const out: any = await c.send(new m.ConverseCommand(input as any));
      return out as ConverseOutput;
    },
  };
}
