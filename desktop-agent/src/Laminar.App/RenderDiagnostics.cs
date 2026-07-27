using System;
using System.Collections.Generic;
using System.IO;

namespace Laminar.App;

/// <summary>
/// Métricas de render OPT-IN (LAMINAR_RENDER_DIAGNOSTICS=1). Cada ~2 s escribe una
/// línea en %TEMP%\laminar_render.log con: frames, ms medio y p95 de OnRender,
/// memoria administrada y contadores de GC. NO registra contenido, títulos ni
/// capturas (coherente con content-blind). Sirve para comparar antes/después.
/// </summary>
public static class RenderDiagnostics
{
    public static readonly bool Enabled =
        string.Equals(Environment.GetEnvironmentVariable("LAMINAR_RENDER_DIAGNOSTICS"), "1", StringComparison.Ordinal);

    private static readonly List<double> _samples = new(512);
    private static readonly object _lock = new();
    private static long _lastDumpMs;
    private static readonly string _logPath = Path.Combine(Path.GetTempPath(), "laminar_render.log");

    /// <summary>Registra la duración (ms) de un OnRender. Barato; no hace nada si está deshabilitado.</summary>
    public static void Frame(double renderMs)
    {
        if (!Enabled) return;
        lock (_lock)
        {
            _samples.Add(renderMs);
            long now = Environment.TickCount64;
            if (now - _lastDumpMs < 2000) return;
            _lastDumpMs = now;
            Dump();
        }
    }

    private static void Dump()
    {
        if (_samples.Count == 0) return;
        var arr = _samples.ToArray();
        Array.Sort(arr);
        double avg = 0;
        foreach (var v in arr) avg += v;
        avg /= arr.Length;
        int p95i = Math.Max(0, Math.Min(arr.Length - 1, (int)Math.Ceiling(arr.Length * 0.95) - 1));
        double p95 = arr[p95i];
        long memMb = GC.GetTotalMemory(false) / (1024 * 1024);

        string line = string.Format(System.Globalization.CultureInfo.InvariantCulture,
            "{0:HH:mm:ss}  frames={1}  avgMs={2:0.00}  p95Ms={3:0.00}  maxMs={4:0.00}  mem={5}MB  gc0={6} gc1={7} gc2={8}{9}",
            DateTime.Now, arr.Length, avg, p95, arr[arr.Length - 1], memMb,
            GC.CollectionCount(0), GC.CollectionCount(1), GC.CollectionCount(2), Environment.NewLine);

        try { File.AppendAllText(_logPath, line); } catch { /* nunca romper por logging */ }
        _samples.Clear();
    }
}
