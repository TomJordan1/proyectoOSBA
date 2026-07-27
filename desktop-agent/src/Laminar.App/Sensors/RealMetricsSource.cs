using System;

namespace Laminar.App;

/// <summary>
/// Fuente de métricas REAL basada en <see cref="InputMonitor"/>. Convierte señales
/// abstractas en un score de fricción y z-scores con línea base adaptativa (EWMA).
/// Content-blind. Sustituye a <see cref="SimulatedMetricsSource"/> cuando
/// LAMINAR_SENSORS=real.
/// </summary>
public sealed class RealMetricsSource : IMetricsSource, IDisposable
{
    private readonly InputMonitor _monitor = new();
    private Ewma _delete = new();
    private Ewma _switch = new();
    private Ewma _cursor = new();

    private int _sustained;
    private int _session;
    private int _lastIntervention = 90;
    private const double IdleAfkSeconds = 120; // 2 min sin actividad = AFK
    private const double Threshold = 0.78;
    // Fatiga por tiempo (tunable): tras FatigueStartMinutes sin pausa, sube el score
    // gradualmente hasta +FatigueMaxBoost a lo largo de FatigueRampMinutes.
    private const double FatigueStartMinutes = 45;
    private const double FatigueRampMinutes = 60;
    private const double FatigueMaxBoost = 0.15;

    public MetricSample Sample()
    {
        var s = _monitor.TakeSnapshot();
        _session++;
        _lastIntervention++;

        double zDel = _delete.Update(s.Corrections);
        double zSw = _switch.Update(s.Switches);
        double zCur = _cursor.Update(s.CursorTurns);

        double score;
        if (s.IdleSeconds >= IdleAfkSeconds)
        {
            score = 0.20;      // AFK: sin fricción
            _sustained = 0;
        }
        else
        {
            // Recalibrado: exige corroboración (2+ señales) y baja el peso del cursor.
            // La fórmula pura vive en Laminar.Friction.FrictionScorer (testeable sin WPF).
            score = Laminar.Friction.FrictionScorer.Score(zDel, zSw, zCur);

            // Fatiga por tiempo (bienestar): tras un rato largo sin pausa, empuja el score
            // para que una fricción moderada sí dispare en jornadas largas. No dispara solo
            // con calma total. Tunable.
            double minsSince = _lastIntervention / 20.0; // ticks (~3s) -> minutos aprox.
            double fatigue = Math.Clamp((minsSince - FatigueStartMinutes) / FatigueRampMinutes, 0, 1) * FatigueMaxBoost;
            score = Math.Clamp(score + fatigue, 0.0, 0.97);

            _sustained = score >= Threshold ? _sustained + 1 : 0;
        }

        return new MetricSample(score, _sustained, Clamp(zDel), Clamp(zSw), Clamp(zCur), _session, _lastIntervention);
    }

    public void NotifyIntervened()
    {
        _sustained = 0;
        _lastIntervention = 0;
    }

    private static double Clamp(double z) => Math.Clamp(z, 0.0, 3.0);

    public void Dispose() => _monitor.Dispose();

    /// <summary>Media y varianza EWMA para un z-score adaptativo.</summary>
    private struct Ewma
    {
        private double _mean;
        private double _var;
        private bool _init;
        private const double Alpha = 0.1; // adapta más rápido: el pico decae y no se queda "pegado"

        public double Update(double x)
        {
            if (!_init) { _mean = x; _var = 1; _init = true; return 0; }
            double diff = x - _mean;
            double z = _var > 1e-6 ? diff / Math.Sqrt(_var) : 0;
            _mean += Alpha * diff;
            _var = (1 - Alpha) * (_var + Alpha * diff * diff);
            return z;
        }
    }
}
