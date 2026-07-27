using Laminar.Friction;
using Xunit;

namespace Laminar.Domain.Tests;

/// <summary>
/// Verifica la recalibración del detector (2026-07-25): exige corroboración de
/// varias señales y neutraliza el falso positivo del cursor bajo CPU saturado.
/// Umbral típico de fricción = 0.78 (FrictionOptions.FrictionThreshold).
/// </summary>
public class FrictionScorerTests
{
    private const double Threshold = 0.78;

    [Fact]
    public void Calm_all_low_is_below_threshold()
    {
        Assert.True(FrictionScorer.Score(0, 0, 0) < Threshold);
        Assert.True(FrictionScorer.Score(0.5, 0.3, 0.4) < Threshold);
    }

    [Fact]
    public void Single_keyboard_spike_does_not_trigger()
    {
        // Una sola señal disparada (correcciones) NO debe cruzar el umbral.
        Assert.True(FrictionScorer.Score(zDelete: 5.0, zSwitch: 0, zCursor: 0) < Threshold);
    }

    [Fact]
    public void Cursor_only_spike_does_not_trigger_even_when_huge()
    {
        // El artefacto del CPU (cursor a tirones) NO debe disparar por sí solo.
        Assert.True(FrictionScorer.Score(zDelete: 0, zSwitch: 0, zCursor: 8.0) < Threshold);
    }

    [Fact]
    public void Keyboard_strong_plus_cursor_moderate_does_not_trigger()
    {
        // El cursor está down-weighted: no basta como segunda señal corroborante.
        Assert.True(FrictionScorer.Score(zDelete: 4.0, zSwitch: 0, zCursor: 2.0) < Threshold);
    }

    [Fact]
    public void Two_strong_real_signals_trigger()
    {
        // Correcciones + cambios de ventana altos = fricción real -> cruza el umbral.
        Assert.True(FrictionScorer.Score(zDelete: 3.0, zSwitch: 3.0, zCursor: 0) >= Threshold);
    }

    [Fact]
    public void Two_moderate_corroborating_signals_trigger()
    {
        Assert.True(FrictionScorer.Score(zDelete: 1.5, zSwitch: 1.5, zCursor: 0) >= Threshold);
    }

    [Fact]
    public void Score_is_bounded()
    {
        double s = FrictionScorer.Score(100, 100, 100);
        Assert.True(s <= FrictionScorer.MaxScore);
        Assert.True(FrictionScorer.Score(-5, -5, -5) >= 0.0);
    }
}
