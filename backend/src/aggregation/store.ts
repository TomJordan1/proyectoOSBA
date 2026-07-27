import type { TeamMetricsPacket } from "../domain/team-types.js";

/**
 * Repositorio de agregados. Abstrae el almacenamiento para que el motor no sepa
 * si los datos viven en memoria (dev) o en DynamoDB (producción). Mismo código,
 * distinta implementación → datos REALES y persistentes sin reescribir la lógica.
 */
export interface AggregateStore {
  put(packet: TeamMetricsPacket): Promise<void>;
  /** Paquetes de una organización/equipo cuyo window_start está en [startIso, endIso]. */
  query(organizationId: string, teamId: string, startIso: string, endIso: string): Promise<TeamMetricsPacket[]>;
}

/** Implementación en memoria: para desarrollo, pruebas y modo demo. No persiste. */
export class InMemoryAggregateStore implements AggregateStore {
  private map = new Map<string, TeamMetricsPacket[]>();
  private key(org: string, team: string): string {
    return `${org}::${team}`;
  }
  async put(packet: TeamMetricsPacket): Promise<void> {
    const k = this.key(packet.organization_id, packet.team_id);
    const list = this.map.get(k) ?? [];
    list.push(packet);
    this.map.set(k, list);
  }
  async query(org: string, team: string, startIso: string, endIso: string): Promise<TeamMetricsPacket[]> {
    const start = Date.parse(startIso), end = Date.parse(endIso);
    return (this.map.get(this.key(org, team)) ?? []).filter((p) => {
      const t = Date.parse(p.window_start);
      return t >= start && t <= end;
    });
  }
}

/**
 * Cliente mínimo de DynamoDB (Document) inyectable, para no depender de la SDK de
 * AWS al compilar/probar. En despliegue se adapta a @aws-sdk/lib-dynamodb.
 * Diseño single-table: pk = "ORG#<org>#TEAM#<team>", sk = "WINDOW#<window_start>".
 */
export interface DocClient {
  put(item: Record<string, unknown>): Promise<void>;
  queryByPkSkRange(pk: string, skPrefix: string, skFrom: string, skTo: string): Promise<Array<Record<string, unknown>>>;
}

export class DynamoAggregateStore implements AggregateStore {
  constructor(
    private readonly client: DocClient,
    private readonly retentionDays = 30,
  ) {}

  private pk(org: string, team: string): string {
    return `ORG#${org}#TEAM#${team}`;
  }

  async put(p: TeamMetricsPacket): Promise<void> {
    const ttl = Math.floor(Date.parse(p.window_start) / 1000) + this.retentionDays * 86400;
    // sk incluye el token de instalación para que varios contribuyentes en la MISMA
    // ventana no se sobrescriban (misma pk+sk = overwrite en DynamoDB). El rango de
    // consulta sigue siendo por WINDOW#<iso>, así que el sufijo no afecta el filtrado.
    const contributor = p.installation_token ?? "anon";
    await this.client.put({
      pk: this.pk(p.organization_id, p.team_id),
      sk: `WINDOW#${p.window_start}#${contributor}`,
      ttl,
      ...p,
    });
  }

  async query(org: string, team: string, startIso: string, endIso: string): Promise<TeamMetricsPacket[]> {
    const items = await this.client.queryByPkSkRange(
      this.pk(org, team),
      "WINDOW#",
      `WINDOW#${startIso}`,
      // Sufijo alto: incluye cualquier sk `WINDOW#<endIso>#<token>` en el borde.
      `WINDOW#${endIso}#￿`,
    );
    // Devuelve solo los campos del contrato (descarta pk/sk/ttl).
    return items.map((it) => {
      const { pk, sk, ttl, ...rest } = it as Record<string, unknown>;
      void pk; void sk; void ttl;
      return rest as unknown as TeamMetricsPacket;
    });
  }
}

/*
 * ADAPTADOR REAL (solo en despliegue, con la SDK instalada):
 *
 *   import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
 *   import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
 *   const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
 *   const table = process.env.AGGREGATES_TABLE!;
 *   const client: DocClient = {
 *     put: async (item) => { await ddb.send(new PutCommand({ TableName: table, Item: item })); },
 *     queryByPkSkRange: async (pk, _pfx, from, to) => {
 *       const r = await ddb.send(new QueryCommand({
 *         TableName: table,
 *         KeyConditionExpression: "pk = :pk AND sk BETWEEN :a AND :b",
 *         ExpressionAttributeValues: { ":pk": pk, ":a": from, ":b": to },
 *       }));
 *       return r.Items ?? [];
 *     },
 *   };
 *   const store = new DynamoAggregateStore(client);
 */
