using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Media;

namespace Laminar.App;

/// <summary>
/// Kanny portado del diseño (Canvas 2D) a WPF con dibujo inmediato (OnRender +
/// DrawingContext) — una sola superficie, acelerada por GPU y ligera. Máquina de
/// estados (afk/normal/erratic/break) con transiciones suaves (Lerp), esfera glassy
/// con glow (simulado por capas de degradado, sin BlurEffect), 50 partículas con
/// física de rebote/onda/caos, conexiones "neuronales" (hashing espacial O(n)),
/// wobble y ojos por estado. Manejado por la fricción real vía SetStress.
/// </summary>
public sealed class KannyView : FrameworkElement
{
    // Índices de parámetros (para lerp en bucle).
    private const int PSpeed = 0, Chaos = 1, Orbit = 2, Glow = 3, WobbleAmt = 4, WobbleSpeed = 5,
        ConnThresh = 6, WaveMode = 7, BounceMode = 8, EyeSep = 9, EyeScale = 10, EyeTilt = 11,
        FloatAmp = 12, ColR = 13, ColG = 14, ColB = 15, N = 16;

    // COLOR FIJO en todos los estados (cian glassy 0,240,255): el estrés se expresa
    // SOLO con deformación (wobble/caos) y partículas rápidas, nunca cambiando el color
    // (diseño original). Índices ColR=13, ColG=14, ColB=15 iguales en los cuatro estados.
    private static readonly double[] Afk = { 0.8, 0, 1.5, 15, 2, 0.02, 0, 0, 0, 30, 2.0, 0, 10, 0, 240, 255 };
    private static readonly double[] Normal = { 0.4, 0, 0, 25, 3, 0.05, 0, 1.0, 0, 35, 2.2, 0, 5, 0, 240, 255 };
    private static readonly double[] Erratic = { 3.5, 1.0, 0, 60, 25, 0.2, 90, 0, 1.0, 45, 2.8, 0.2, 2, 0, 240, 255 };
    // Break (pausa): reposo como en el diseño de referencia → cuerpo SIN deformación
    // (WobbleAmt 0) y ojos relajados/más pequeños (EyeScale 1.2, EyeSep 24). Referencia
    // original usa 0.5 (dormido); 1.2 lo deja presente para el diálogo. Color cian fijo.
    private static readonly double[] Break = { 0.2, 0, 0.15, 20, 0, 0, 0, 0.6, 0, 24, 1.2, 0, 14, 0, 240, 255 };

    private const double R0 = 150.0;   // radio de Kanny en el espacio del diseño
    private readonly double[] _cur = (double[])Afk.Clone();
    private readonly double[] _target = (double[])Afk.Clone();

    private readonly Random _rng = new();
    private readonly List<Particle> _particles = new();
    private long _time;
    private double _waveTime;
    private bool _break;

    // Recursos cacheados (evita asignaciones por frame).
    private static readonly Brush White = Frozen(new SolidColorBrush(Colors.White));
    private static readonly Brush CyanGlow = Frozen(new SolidColorBrush(Color.FromRgb(0, 240, 255)));
    // Glow suave y difuso de los ojos (sin borde → no forma anillo).
    private static readonly Brush EyeGlow = Frozen(new RadialGradientBrush
    {
        GradientStops = new GradientStopCollection
        {
            new GradientStop(Color.FromArgb(150, 255, 255, 255), 0.0),
            new GradientStop(Color.FromArgb(55, 255, 255, 255), 0.45),
            new GradientStop(Color.FromArgb(0, 255, 255, 255), 1.0),
        }
    });
    // --- MODO CLARO (fondo blanco): refuerzos glassmorphism, valores CONFIGURABLES ---
    // Alpha máximo del respaldo central en fondo blanco (prueba 75 / 82 / 90):
    private const double BackingMaxAlpha = 82;
    // Histéresis de luminancia para no parpadear entre modos:
    private const double LightEnterLum = 0.82; // entra a modo claro por encima de esto
    private const double LightExitLum = 0.72;   // sale de modo claro por debajo de esto
    // Intensidades relativas de los refuerzos (0..1):
    private const double HaloStrength = 0.5, EdgeStrength = 0.6, HighlightStrength = 0.7, ShadowStrength = 0.28;

    // Respaldo translúcido ceñido: perfil de alpha 255→0 (el alpha real lo pone PushOpacity
    // = lightAmt * BackingMaxAlpha/255, así se compara fácil). Glassy, no sólido.
    private static readonly Brush BackingBrush = Frozen(new RadialGradientBrush
    {
        GradientStops = new GradientStopCollection
        {
            new GradientStop(Color.FromArgb(255, 12, 26, 34), 0.0),
            new GradientStop(Color.FromArgb(235, 12, 26, 34), 0.68),
            new GradientStop(Color.FromArgb(90, 12, 26, 34), 0.88),
            new GradientStop(Color.FromArgb(0, 12, 26, 34), 1.0),
        }
    });
    // Sombra difusa mínima debajo del orbe (separación del blanco), sin BlurEffect.
    private static readonly Brush ShadowBrush = Frozen(new RadialGradientBrush
    {
        GradientStops = new GradientStopCollection
        {
            new GradientStop(Color.FromArgb(160, 0, 0, 0), 0.0),
            new GradientStop(Color.FromArgb(0, 0, 0, 0), 1.0),
        }
    });
    // Halo exterior cian muy suave (anillo), refuerza el borde sobre blanco.
    private static readonly Brush LightHaloBrush = Frozen(new RadialGradientBrush
    {
        GradientStops = new GradientStopCollection
        {
            new GradientStop(Color.FromArgb(0, 0, 240, 255), 0.62),
            new GradientStop(Color.FromArgb(150, 40, 220, 245), 0.83),
            new GradientStop(Color.FromArgb(0, 0, 240, 255), 1.0),
        }
    });
    // Reflejo superior (highlight) para dar sensación de vidrio.
    private static readonly Brush HighlightBrush = Frozen(new RadialGradientBrush
    {
        GradientStops = new GradientStopCollection
        {
            new GradientStop(Color.FromArgb(235, 255, 255, 255), 0.0),
            new GradientStop(Color.FromArgb(0, 255, 255, 255), 1.0),
        }
    });
    // Borde cian reforzado (se dibuja encima del contorno solo en modo claro).
    private static readonly Pen CyanEdgePen = Frozen(new Pen(new SolidColorBrush(Color.FromRgb(60, 220, 245)), 2.5));
    private static readonly Pen ConnPen = Frozen(new Pen(new SolidColorBrush(Color.FromRgb(150, 240, 255)), 1));
    private static readonly Pen TrailPen = Frozen(new Pen(new SolidColorBrush(Color.FromRgb(0, 220, 240)), 1.5));
    private static readonly Pen EdgePen = Frozen(new Pen(new SolidColorBrush(Color.FromArgb(77, 255, 255, 255)), 2));

    // Gradientes de cuerpo/halo cacheados por color: solo se reconstruyen cuando el
    // color cambia. En modo break/estable (color fijo) NO se crean por frame.
    private Brush? _bodyBrush;
    private Brush? _haloBrush;
    private int _brushKey = -1;
    private bool _hooked;
    private bool _paused;
    private double _ambient = 0.35; // brillo del fondo [0..1]: 0 oscuro, 1 claro
    private bool _inLight;          // estado (con histéresis) de "fondo claro"
    private double _lightAmt;       // 0..1 suavizado hacia _inLight (transición ~250-300ms)

    /// <summary>Brillo del fondo detrás del acompañante (sensor de luz ambiental, content-blind).</summary>
    public void SetAmbient(double lum)
    {
        _ambient = Math.Clamp(lum, 0, 1);
        // Histéresis: entra a modo claro por encima de LightEnterLum, sale por debajo de LightExitLum.
        if (!_inLight && _ambient > LightEnterLum) _inLight = true;
        else if (_inLight && _ambient < LightExitLum) _inLight = false;
    }

    /// <summary>Si es true, deja de animar (reduce-motion / estático). Congela el último frame.</summary>
    public bool Paused { get => _paused; set => _paused = value; }

    /// <summary>Radio visual de Kanny (px). Pequeño en la esquina, grande en la pausa.</summary>
    public double BaseRadius { get; set; } = 60;

    /// <summary>Nº de partículas. Menos = más ligero (la esquina no necesita 50).</summary>
    public int ParticleCount { get; set; } = 50;

    /// <summary>Fotogramas por segundo objetivo (30 basta y ahorra CPU).</summary>
    public double TargetFps { get; set; } = 30;

    private long _lastFrameMs;

    public KannyView()
    {
        Loaded += (_, _) =>
        {
            if (_hooked) return; // una sola suscripción (sin handlers duplicados)
            if (_particles.Count == 0)
                for (int i = 0; i < Math.Max(4, ParticleCount); i++) _particles.Add(new Particle(_rng));
            CompositionTarget.Rendering += OnFrame;
            _hooked = true;
        };
        Unloaded += (_, _) =>
        {
            if (!_hooked) return;
            CompositionTarget.Rendering -= OnFrame;
            _hooked = false;
        };
        IsHitTestVisible = false;
    }

    /// <summary>0 = calmado, 1 = muy frustrado. Mapea a estado (afk/normal/erratic).</summary>
    public void SetStress(double s)
    {
        if (_break) return;
        s = Math.Clamp(s, 0, 1);
        double[] st = s <= 0.25 ? Afk : (s < 0.6 ? Normal : Erratic);
        Array.Copy(st, _target, N);
    }

    /// <summary>Modo descanso (pausa de recuperación): estado break.</summary>
    public void SetBreak(bool on)
    {
        _break = on;
        Array.Copy(on ? Break : Normal, _target, N);
    }

    private void OnFrame(object? sender, EventArgs e)
    {
        if (!IsVisible || _paused) return;
        // Limita a TargetFps: no recalcula ni redibuja en cada frame de 60fps.
        long now = Environment.TickCount64;
        if (now - _lastFrameMs < 1000.0 / Math.Max(1, TargetFps)) return;
        _lastFrameMs = now;
        _time++;
        _waveTime += _cur[PSpeed] * 0.03;

        // Lerp suave de todos los parámetros hacia el objetivo.
        for (int i = 0; i < N; i++)
        {
            _cur[i] = _cur[i] + (_target[i] - _cur[i]) * 0.03;
            if (Math.Abs(_cur[i] - _target[i]) < 0.005) _cur[i] = _target[i];
        }
        // Transición suave del modo claro (fundido lento, ~550-650 ms a 30 fps): que
        // aparezca/desaparezca desvaneciéndose, no de golpe.
        double lightTarget = _inLight ? 1.0 : 0.0;
        _lightAmt += (lightTarget - _lightAmt) * 0.07;
        if (Math.Abs(lightTarget - _lightAmt) < 0.003) _lightAmt = lightTarget;
        foreach (var p in _particles) p.Update(_cur, R0, _time, _waveTime, _rng);
        InvalidateVisual();
    }

    protected override void OnRender(DrawingContext dc)
    {
        double k = BaseRadius / R0;
        double cx = ActualWidth / 2;
        double cy = ActualHeight / 2 + Math.Sin(_time * 0.03) * _cur[FloatAmp] * k;
        byte r = (byte)Math.Clamp(_cur[ColR], 0, 255);
        byte g = (byte)Math.Clamp(_cur[ColG], 0, 255);
        byte b = (byte)Math.Clamp(_cur[ColB], 0, 255);
        var center = new Point(cx, cy);

        // Reconstruye los gradientes SOLO si el color cambió. En modo break/estable
        // (color fijo) se reutilizan y no se crean por frame (item de optimización).
        int bkey = (r << 16) | (g << 8) | b;
        if (_brushKey != bkey || _bodyBrush == null)
        {
            _brushKey = bkey;
            _haloBrush = Frozen(new RadialGradientBrush
            {
                GradientStops = new GradientStopCollection
                {
                    new GradientStop(Color.FromArgb(150, r, g, b), 0.55),
                    new GradientStop(Color.FromArgb(0, r, g, b), 1.0),
                }
            });
            _bodyBrush = Frozen(new RadialGradientBrush
            {
                GradientOrigin = new Point(0.35, 0.35),
                Center = new Point(0.5, 0.5),
                RadiusX = 0.6,
                RadiusY = 0.6,
                GradientStops = new GradientStopCollection
                {
                    new GradientStop(Color.FromArgb(102, 255, 255, 255), 0.0),
                    new GradientStop(Color.FromArgb(51, r, g, b), 0.3),
                    new GradientStop(Color.FromArgb(26, r, g, b), 0.8),
                    new GradientStop(Color.FromArgb(102, r, g, b), 1.0),
                }
            });
        }

        // 0) MODO CLARO (fondo blanco): glassmorphism. Solo actúa con _lightAmt>0; en
        // fondos normales/oscuros no dibuja nada (diseño actual intacto). Sin BlurEffect.
        double la = _lightAmt;
        if (la > 0.02)
        {
            // Sombra difusa mínima debajo del orbe (aplanada), separa del blanco.
            var sc = new Point(cx, cy + BaseRadius * 0.72);
            dc.PushOpacity(la * ShadowStrength);
            dc.PushTransform(new ScaleTransform(1.0, 0.4, sc.X, sc.Y));
            dc.DrawEllipse(ShadowBrush, null, sc, BaseRadius * 0.95, BaseRadius * 0.95);
            dc.Pop(); dc.Pop();

            // Respaldo translúcido ceñido (alpha real = la * BackingMaxAlpha/255).
            dc.PushOpacity(la * (BackingMaxAlpha / 255.0));
            dc.DrawEllipse(BackingBrush, null, center, BaseRadius * 1.06, BaseRadius * 1.06);
            dc.Pop();

            // Halo exterior cian muy suave, ceñido al borde (sobresale poco).
            dc.PushOpacity(la * HaloStrength);
            dc.DrawEllipse(LightHaloBrush, null, center, BaseRadius * 1.18, BaseRadius * 1.18);
            dc.Pop();
        }

        // 1) Glow exterior (halo cacheado).
        double glow = _cur[Glow] * k;
        if (glow > 0.5)
        {
            double hr = BaseRadius + glow;
            dc.DrawEllipse(_haloBrush, null, center, hr, hr);
        }

        // 2) Cuerpo glassy (polígono con wobble + degradado cacheado).
        var body = BuildBody(cx, cy, k);
        dc.DrawGeometry(_bodyBrush, EdgePen, body);

        // 2b) MODO CLARO: refuerzo del borde cian + reflejo superior (glassy), sin tocar
        // la opacidad del cuerpo (el centro sigue translúcido y luminoso).
        if (la > 0.02)
        {
            dc.PushOpacity(la * EdgeStrength);
            dc.DrawGeometry(null, CyanEdgePen, body);
            dc.Pop();

            var hc = new Point(cx - BaseRadius * 0.28, cy - BaseRadius * 0.34);
            dc.PushOpacity(la * HighlightStrength);
            dc.DrawEllipse(HighlightBrush, null, hc, BaseRadius * 0.5, BaseRadius * 0.4);
            dc.Pop();
        }

        // 3) Estelas de onda (NORMAL).
        if (_cur[WaveMode] > 0.01) DrawWaveTrails(dc, cx, cy, k);

        // 4) Conexiones "neuronales" (ERRATIC) con hashing espacial O(n).
        if (_cur[ConnThresh] > 0.5) DrawConnections(dc, cx, cy, k);

        // 5) Partículas luminosas.
        foreach (var p in _particles)
        {
            double px = cx + p.X * k, py = cy + p.Y * k;
            double rad = p.Radius * k;
            var pc = new Point(px, py);
            dc.PushOpacity(Math.Clamp(p.Alpha * (0.4 + la * 0.25), 0, 1)); // glow (un poco más en modo claro)
            dc.DrawEllipse(CyanGlow, null, pc, rad * 2.4, rad * 2.4); // glow suave
            dc.Pop();
            dc.PushOpacity(Math.Clamp(p.Alpha, 0, 1));
            dc.DrawEllipse(White, null, pc, rad, rad);
            dc.Pop();
        }

        // 6) Ojos por estado.
        double lookX = Math.Sin(_time * 0.05) * _cur[WobbleAmt] * 0.2 * k;
        double lookY = Math.Cos(_time * 0.04) * _cur[WobbleAmt] * 0.2 * k;
        double eyeR = 10 * _cur[EyeScale] * k;
        double sep = _cur[EyeSep] * k;
        double tiltDeg = _cur[EyeTilt] * 180.0 / Math.PI;
        dc.PushTransform(new RotateTransform(tiltDeg, cx, cy));
        var eL = new Point(cx - sep + lookX, cy + lookY);
        var eR = new Point(cx + sep + lookX, cy + lookY);
        // Ojo blanco sólido al tamaño que tenía el anillo (1.5×) + glow difuso alrededor
        // (sin borde → no forma anillo).
        double eyeRw = eyeR * 1.15;
        dc.DrawEllipse(EyeGlow, null, eL, eyeRw * 1.5, eyeRw * 1.5);
        dc.DrawEllipse(EyeGlow, null, eR, eyeRw * 1.5, eyeRw * 1.5);
        dc.DrawEllipse(White, null, eL, eyeRw, eyeRw);
        dc.DrawEllipse(White, null, eR, eyeRw, eyeRw);
        dc.Pop();
    }

    private Geometry BuildBody(double cx, double cy, double k)
    {
        var geo = new StreamGeometry();
        const int segments = 30;
        using (var c = geo.Open())
        {
            Point First(int i)
            {
                double angle = (double)i / segments * Math.PI * 2;
                double rad = R0;
                if (_cur[WobbleAmt] > 0)
                {
                    double w1 = Math.Sin(angle * 3 + _time * _cur[WobbleSpeed]);
                    double w2 = Math.Cos(angle * 5 - _time * _cur[WobbleSpeed] * 1.5);
                    double w3 = Math.Sin(angle * 2 + _time * _cur[WobbleSpeed] * 2);
                    rad += (w1 + w2 + w3) / 3 * _cur[WobbleAmt];
                }
                return new Point(cx + Math.Cos(angle) * rad * k, cy + Math.Sin(angle) * rad * k);
            }
            c.BeginFigure(First(0), true, true);
            var pts = new List<Point>(segments);
            for (int i = 1; i <= segments; i++) pts.Add(First(i));
            c.PolyLineTo(pts, true, true);
        }
        geo.Freeze();
        return geo;
    }

    private void DrawWaveTrails(DrawingContext dc, double cx, double cy, double k)
    {
        double trailAlpha = 0.3 * _cur[WaveMode];
        var sorted = new List<Particle>(_particles);
        sorted.Sort((a, b) => a.WaveDir.CompareTo(b.WaveDir));
        for (int i = 0; i < sorted.Count - 1; i++)
        {
            var p1 = sorted[i]; var p2 = sorted[i + 1];
            if (Math.Abs(p1.WaveDir - p2.WaveDir) >= 0.3) continue;
            double dx = p1.X - p2.X, dy = p1.Y - p2.Y;
            double dist = Math.Sqrt(dx * dx + dy * dy);
            if (dist >= R0 * 0.8 || dist <= 5) continue;
            double a = trailAlpha * (1 - dist / (R0 * 0.8));
            var fig = new PathFigure { StartPoint = new Point(cx + p1.X * k, cy + p1.Y * k) };
            double midX = (p1.X + p2.X) / 2 + Math.Sin(_time * 0.02 + i) * 5;
            double midY = (p1.Y + p2.Y) / 2 + Math.Cos(_time * 0.02 + i) * 5;
            fig.Segments.Add(new QuadraticBezierSegment(
                new Point(cx + midX * k, cy + midY * k),
                new Point(cx + p2.X * k, cy + p2.Y * k), true));
            var pg = new PathGeometry(); pg.Figures.Add(fig);
            dc.PushOpacity(Math.Clamp(a, 0, 1));
            dc.DrawGeometry(null, TrailPen, pg);
            dc.Pop();
        }
    }

    private void DrawConnections(DrawingContext dc, double cx, double cy, double k)
    {
        double thresh = _cur[ConnThresh];
        double cell = Math.Max(1, thresh);
        // Hashing espacial: bucket por celda (O(n) en vez de O(n^2)).
        var grid = new Dictionary<long, List<int>>();
        long Key(int gx, int gy) => ((long)gx << 32) ^ (uint)gy;
        for (int i = 0; i < _particles.Count; i++)
        {
            int gx = (int)Math.Floor(_particles[i].X / cell);
            int gy = (int)Math.Floor(_particles[i].Y / cell);
            var key = Key(gx, gy);
            if (!grid.TryGetValue(key, out var list)) grid[key] = list = new List<int>();
            list.Add(i);
        }
        double threshSq = thresh * thresh;
        for (int i = 0; i < _particles.Count; i++)
        {
            var pi = _particles[i];
            int gx = (int)Math.Floor(pi.X / cell), gy = (int)Math.Floor(pi.Y / cell);
            for (int ox = -1; ox <= 1; ox++)
                for (int oy = -1; oy <= 1; oy++)
                {
                    if (!grid.TryGetValue(Key(gx + ox, gy + oy), out var list)) continue;
                    foreach (int j in list)
                    {
                        if (j <= i) continue;
                        var pj = _particles[j];
                        double dx = pi.X - pj.X, dy = pi.Y - pj.Y;
                        double distSq = dx * dx + dy * dy;
                        if (distSq >= threshSq) continue;
                        double dist = Math.Sqrt(distSq);
                        double a = (1 - dist / thresh) * 0.6;
                        var fig = new PathFigure { StartPoint = new Point(cx + pi.X * k, cy + pi.Y * k) };
                        if (_cur[Chaos] > 0.5 && dist > thresh * 0.3)
                        {
                            double mx = (pi.X + pj.X) / 2 + (_rng.NextDouble() - 0.5) * 20 * _cur[Chaos];
                            double my = (pi.Y + pj.Y) / 2 + (_rng.NextDouble() - 0.5) * 20 * _cur[Chaos];
                            fig.Segments.Add(new LineSegment(new Point(cx + mx * k, cy + my * k), true));
                        }
                        fig.Segments.Add(new LineSegment(new Point(cx + pj.X * k, cy + pj.Y * k), true));
                        var pg = new PathGeometry(); pg.Figures.Add(fig);
                        dc.PushOpacity(Math.Clamp(a, 0, 1));
                        dc.DrawGeometry(null, ConnPen, pg);
                        dc.Pop();
                    }
                }
        }
    }

    private static T Frozen<T>(T f) where T : Freezable { f.Freeze(); return f; }

    /// <summary>Partícula luminosa interna (portada de particles.js).</summary>
    private sealed class Particle
    {
        public double X, Y, Vx, Vy, BaseRadius, Radius, BaseAlpha, Alpha, ZDepth, WavePhase, WaveFreq, WaveLane, WaveDir;

        public Particle(Random rng) { Reset(rng, 150, true); }

        public void Reset(Random rng, double kr, bool anywhere)
        {
            double ang = rng.NextDouble() * Math.PI * 2;
            double rad = rng.NextDouble() * (anywhere ? kr : kr * 0.5);
            X = Math.Cos(ang) * rad; Y = Math.Sin(ang) * rad;
            double va = rng.NextDouble() * Math.PI * 2;
            Vx = Math.Cos(va); Vy = Math.Sin(va);
            BaseRadius = 1.5 + rng.NextDouble() * 2.5; Radius = BaseRadius;
            BaseAlpha = 0.3 + rng.NextDouble() * 0.7; Alpha = BaseAlpha;
            ZDepth = rng.NextDouble();
            WavePhase = rng.NextDouble() * Math.PI * 2;
            WaveFreq = 0.8 + rng.NextDouble() * 1.2;
            WaveLane = (rng.NextDouble() - 0.5) * 2;
            WaveDir = rng.NextDouble() * Math.PI * 2;
        }

        public void Update(double[] p, double kr, long time, double waveTime, Random rng)
        {
            double ms = time * 16.0;
            double jitterX = 0, jitterY = 0;
            if (p[Chaos] > 0) { jitterX = (rng.NextDouble() - 0.5) * p[Chaos] * 5; jitterY = (rng.NextDouble() - 0.5) * p[Chaos] * 5; }

            if (p[BounceMode] > 0.5)
            {
                double speed = p[PSpeed] * (0.7 + ZDepth * 0.3);
                X += Vx * speed + jitterX * speed;
                Y += Vy * speed + jitterY * speed;
                double dist = Math.Sqrt(X * X + Y * Y);
                double boundary = kr * 0.88;
                if (dist >= boundary && dist > 0)
                {
                    double nx = -X / dist, ny = -Y / dist;
                    double dot = Vx * nx + Vy * ny;
                    Vx -= 2 * dot * nx; Vy -= 2 * dot * ny;
                    X = X / dist * boundary * 0.98; Y = Y / dist * boundary * 0.98;
                    Vx += (rng.NextDouble() - 0.5) * 0.3; Vy += (rng.NextDouble() - 0.5) * 0.3;
                }
                double cs = Math.Sqrt(Vx * Vx + Vy * Vy);
                if (cs > 0) { double ts = 1.5 + ZDepth; Vx = Vx / cs * ts; Vy = Vy / cs * ts; }
                Alpha = BaseAlpha * (0.6 + 0.4 * Math.Abs(Math.Sin(ms * 0.02 * ZDepth)));
                Alpha = Math.Max(0.3, Math.Min(1, Alpha));
            }
            else
            {
                double speedMult = p[PSpeed] * (0.5 + ZDepth * 0.5);
                if (p[Orbit] > 0)
                {
                    double d = Math.Sqrt(X * X + Y * Y);
                    if (d > 0) { double nx = X / d, ny = Y / d; Vx += -ny * p[Orbit] * 0.05; Vy += nx * p[Orbit] * 0.05; }
                }
                Vx *= 0.98; Vy *= 0.98;
                Vx += (rng.NextDouble() - 0.5) * 0.1; Vy += (rng.NextDouble() - 0.5) * 0.1;
                double cs = Math.Sqrt(Vx * Vx + Vy * Vy);
                if (cs > 0 && cs < 0.5) { Vx = Vx / cs * 0.5; Vy = Vy / cs * 0.5; }
                X += (Vx + jitterX) * speedMult; Y += (Vy + jitterY) * speedMult;
                double dist = Math.Sqrt(X * X + Y * Y);
                double boundary = kr * 0.9;
                if (dist > boundary)
                {
                    double nx = X / dist, ny = Y / dist;
                    Vx -= nx * 0.2 * speedMult; Vy -= ny * 0.2 * speedMult;
                    if (dist > kr * 1.1) Reset(rng, kr, false);
                }
                Alpha = BaseAlpha + p[Chaos] * 0.3 * Math.Sin(ms * 0.01 * ZDepth);
                Alpha = Math.Max(0.1, Math.Min(1, Alpha));
            }

            if (p[WaveMode] > 0.001)
            {
                double wi = p[WaveMode];
                double blend = wi * wi;
                double progress = waveTime + WavePhase;
                double along = Math.Sin(progress * 0.5) * kr * 0.75;
                double perpAmt = Math.Sin(progress * WaveFreq + WaveLane * Math.PI) * kr * 0.35;
                double laneOffset = WaveLane * kr * 0.6;
                double dirX = Math.Cos(WaveDir), dirY = Math.Sin(WaveDir);
                double perpX = -dirY, perpY = dirX;
                double waveX = along * dirX + (perpAmt + laneOffset) * perpX;
                double waveY = along * dirY + (perpAmt + laneOffset) * perpY;
                X = X * (1 - blend) + waveX * blend;
                Y = Y * (1 - blend) + waveY * blend;
                if (wi > 0.5) { Vx = (waveX - X) * 0.1; Vy = (waveY - Y) * 0.1; }
                double dist = Math.Sqrt(X * X + Y * Y);
                double wb = kr * 0.85;
                if (dist > wb) { double over = dist - wb; X -= X / dist * over * blend; Y -= Y / dist * over * blend; }
                double ta = BaseAlpha * (0.7 + 0.3 * Math.Sin(progress * 2));
                Alpha = Alpha * (1 - blend) + ta * blend;
                Alpha = Math.Max(0.1, Math.Min(1, Alpha));
            }
        }
    }
}
