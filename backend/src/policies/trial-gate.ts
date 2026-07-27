// Gate de códigos de prueba: tope de gasto de IA por código (proxy de ~US$0.50).
// El código viaja en el header HTTP `x-trial-code` (NO en el cuerpo → no cambia el
// contrato JSON). Cada llamada real a la IA consume 1 del cupo del código; al agotarse
// o vencer, el backend deja de llamar a la IA y cae a la política local.

export interface TrialStore {
  /**
   * Intenta consumir 1 llamada del código. Devuelve true si se permite (código
   * existente, activo, no vencido y bajo el tope). Debe ser ATÓMICO.
   */
  consume(code: string, defaultCap: number, now: Date): Promise<boolean>;
}

export class TrialGate {
  constructor(private readonly store: TrialStore, private readonly defaultCap: number) {}

  /** true si se permite llamar a la IA con este código. Sin código → denegado. */
  async allow(code: string | undefined, now: Date = new Date()): Promise<boolean> {
    const c = (code ?? "").trim();
    if (c === "") return false; // gating activo: se exige un código válido
    try {
      return await this.store.consume(c, this.defaultCap, now);
    } catch {
      return false; // ante error del store, no gastar IA (degradación segura)
    }
  }
}

interface TrialRecord {
  active: boolean;
  expiresAt: string; // ISO 8601 UTC (comparable lexicográficamente)
  callsUsed: number;
  maxCalls?: number; // tope por código; si falta, usa el default
}

/** Store en memoria para pruebas y desarrollo local. */
export class InMemoryTrialStore implements TrialStore {
  private readonly codes = new Map<string, TrialRecord>();

  put(code: string, rec: Partial<TrialRecord> & { expiresAt: string }): void {
    this.codes.set(code, { active: true, callsUsed: 0, ...rec });
  }

  async consume(code: string, defaultCap: number, now: Date): Promise<boolean> {
    const r = this.codes.get(code);
    if (!r || !r.active) return false;
    if (new Date(r.expiresAt).getTime() <= now.getTime()) return false;
    const cap = r.maxCalls ?? defaultCap;
    if (r.callsUsed >= cap) return false;
    r.callsUsed += 1;
    return true;
  }
}

/**
 * Store DynamoDB con incremento condicional ATÓMICO (una sola operación UpdateItem):
 * permite y suma 1 solo si el código existe, está activo, no venció y no superó el tope.
 * Si la condición falla → ConditionalCheckFailedException → denegado.
 * Import dinámico de la SDK (igual que aggregation/dynamo-client) para compilar sin ella.
 */
export function makeDynamoTrialStore(table: string): TrialStore {
  const CLIENT = "@aws-sdk/client-dynamodb";
  const LIB = "@aws-sdk/lib-dynamodb";
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
    async consume(code: string, _defaultCap: number, now: Date): Promise<boolean> {
      const l: any = await import(LIB);
      const d = await doc();
      try {
        await d.send(new l.UpdateCommand({
          TableName: table,
          Key: { code },
          // Todos los nombres con alias (evita choque con palabras reservadas de DynamoDB).
          // if_not_exists SOLO es válido en UpdateExpression, NO en ConditionExpression.
          // Los códigos se crean siempre con callsUsed y maxCalls, así que la condición
          // compara los atributos directamente.
          UpdateExpression: "SET #c = if_not_exists(#c, :zero) + :one",
          ConditionExpression:
            "attribute_exists(#k) AND #a = :true AND #e > :now AND #c < #m",
          ExpressionAttributeNames: { "#k": "code", "#c": "callsUsed", "#a": "active", "#e": "expiresAt", "#m": "maxCalls" },
          ExpressionAttributeValues: { ":one": 1, ":zero": 0, ":true": true, ":now": now.toISOString() },
        }));
        return true;
      } catch (err: any) {
        if (err?.name === "ConditionalCheckFailedException") {
          console.log(JSON.stringify({ evt: "trial_denied", reason: "condition_failed" }));
          return false;
        }
        // Log content-blind del error (sin el código) para diagnóstico.
        console.log(JSON.stringify({ evt: "trial_error", name: err?.name ?? "unknown", msg: String(err?.message ?? "").slice(0, 160) }));
        throw err;
      }
    },
  };
}
