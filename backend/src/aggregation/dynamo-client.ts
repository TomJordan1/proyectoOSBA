import type { DocClient } from "./store.js";

/**
 * Crea un DocClient real sobre DynamoDB. Usa import dinámico de la SDK de AWS
 * (especificador no-literal) para que el proyecto compile sin la SDK instalada;
 * en el entorno Lambda la SDK v3 está disponible y estas importaciones resuelven.
 */
export function makeDynamoDocClient(table: string): DocClient {
  const CLIENT: string = "@aws-sdk/client-dynamodb";
  const LIB: string = "@aws-sdk/lib-dynamodb";
  let docP: Promise<any> | null = null;
  async function doc(): Promise<any> {
    if (!docP) {
      docP = (async () => {
        const c: any = await import(CLIENT);
        const l: any = await import(LIB);
        return l.DynamoDBDocumentClient.from(new c.DynamoDBClient({}));
      })();
    }
    return docP;
  }
  return {
    async put(item: Record<string, unknown>): Promise<void> {
      const l: any = await import(LIB);
      const d = await doc();
      await d.send(new l.PutCommand({ TableName: table, Item: item }));
    },
    async queryByPkSkRange(pk, _skPrefix, from, to) {
      const l: any = await import(LIB);
      const d = await doc();
      const r = await d.send(new l.QueryCommand({
        TableName: table,
        KeyConditionExpression: "pk = :pk AND sk BETWEEN :a AND :b",
        ExpressionAttributeValues: { ":pk": pk, ":a": from, ":b": to },
      }));
      return (r.Items ?? []) as Array<Record<string, unknown>>;
    },
  };
}
