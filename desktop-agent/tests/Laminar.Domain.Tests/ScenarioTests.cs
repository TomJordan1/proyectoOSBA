using Laminar.Domain;
using Laminar.Friction;
using Laminar.AgentClient;
using Xunit;

namespace Laminar.Domain.Tests;

public class ScenarioTests
{
    private static readonly FrictionOptions Opt = new();
    private static MockAgentClient Client() => new(Opt);

    private static DecisionRequest Req(double score, int sustained, bool prot, bool quiet, int lastInt, string pref, bool rm, int maxDur) =>
        new("1.0", Guid.NewGuid().ToString(), DateTime.UtcNow.ToString("o"),
            new Friction(score, sustained, 1.5, 1.6, 1.2),
            new DecisionContext(prot, prot, prot, quiet, 60, lastInt),
            new Preferences(pref, rm, maxDur));

    [Fact]
    public async Task A_stable_do_nothing()
    {
        var r = await Client().DecideAsync(Req(0.30, 0, false, false, 90, "bubbles", false, 45));
        Assert.Equal(LaminarAction.do_nothing, r.Action);
        Assert.Equal("STABLE_PATTERN", r.ReasonCode);
    }

    [Fact]
    public async Task B_friction_launch_bubble()
    {
        var r = await Client().DecideAsync(Req(0.86, 6, false, false, 48, "bubbles", false, 45));
        Assert.Equal(LaminarAction.launch_bubble_recovery, r.Action);
        Assert.True(r.Arguments.DurationSeconds <= 60);
    }

    [Fact]
    public async Task C_protected_postpone_no_overlay()
    {
        var r = await Client().DecideAsync(Req(0.88, 5, true, false, 60, "bubbles", false, 45));
        Assert.Equal(LaminarAction.postpone_intervention, r.Action);
        Assert.Equal("PROTECTED_CONTEXT", r.ReasonCode);
    }

    [Fact]
    public async Task D_resumed_subtle_notification()
    {
        var r = await Client().DecideAsync(Req(0.80, 5, false, false, 20, "breathing", true, 30));
        Assert.Equal(LaminarAction.show_subtle_notification, r.Action);
    }

    [Fact]
    public void Revalidator_downgrades_over_60s()
    {
        var v = new ResponseValidator(Opt);
        var ctx = new DecisionContext(false, false, false, false, 60, 40);
        var resp = new DecisionResponse("1.0", Guid.NewGuid().ToString(), "e", LaminarAction.launch_bubble_recovery,
            new DecisionArguments(999, "low"), "SUSTAINED_FRICTION_CONTEXT_AVAILABLE", "x",
            DateTime.UtcNow.AddSeconds(20).ToString("o"), "mock", false);
        var outp = v.Revalidate(resp, ctx, DateTime.UtcNow);
        Assert.Equal(LaminarAction.do_nothing, outp.Action);
    }
}
