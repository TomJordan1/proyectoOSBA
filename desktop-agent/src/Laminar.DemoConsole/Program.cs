using Laminar.Domain;
using Laminar.Friction;
using Laminar.AgentClient;

// Recorre los cuatro escenarios con el MockAgentClient (sin AWS). Espejo de backend/scripts/demo.ts.
var options = new FrictionOptions();
var client = new MockAgentClient(options);

var scenarios = new (string Label, DecisionRequest Req)[]
{
    ("A stable",    Demo("11111111-1111-1111-1111-111111111111", 0.30, 0, false, false, 90, "bubbles", false, 45)),
    ("B friction",  Demo("22222222-2222-2222-2222-222222222222", 0.86, 4, false, false, 48, "bubbles", false, 45)),
    ("C protected", Demo("33333333-3333-3333-3333-333333333333", 0.88, 5, true,  false, 60, "bubbles", false, 45)),
    ("D resumed",   Demo("44444444-4444-4444-4444-444444444444", 0.80, 3, false, false, 20, "breathing", true, 30)),
};

foreach (var (label, req) in scenarios)
{
    var d = await client.DecideAsync(req);
    Console.WriteLine($"{label,-12} -> {d.Action,-24} {d.ReasonCode,-38} [{d.DecisionSource}]");
}

static DecisionRequest Demo(string id, double score, int sustained, bool protectedCtx, bool quiet,
    int lastIntervention, string pref, bool reducedMotion, int maxDur) =>
    new("1.0", id, DateTime.UtcNow.ToString("o"),
        new Laminar.Domain.Friction(score, sustained, 1.5, 1.6, 1.2),
        new DecisionContext(protectedCtx, protectedCtx, protectedCtx, quiet, 60, lastIntervention),
        new Preferences(pref, reducedMotion, maxDur));
