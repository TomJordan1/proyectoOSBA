using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Media;

namespace Laminar.App;

/// <summary>
/// Escena de la pausa activa (port del diseño HTML): fondo radial verdoso-teal,
/// corrientes bézier, partículas orbitando en elipses anchas y el efecto "sonar"
/// (anillos de respiración que se expanden + arcos girando). Vectorial con
/// DrawingContext (pocos elementos → nítido y ligero). Expone la fase y la escala
/// de respiración (8 s: inhala 3 / mantén 1 / exhala 4) para sincronizar a Kanny y
/// el texto guía.
/// </summary>
public sealed class PauseScene : FrameworkElement
{
    public double TargetFps { get; set; } = 24;

    /// <summary>Escala actual de respiración (para Kanny).</summary>
    public double BreathScale { get; private set; } = 1;
    /// <summary>Fase actual: "Inhala" / "Mantén" / "Exhala".</summary>
    public string BreathPhase { get; private set; } = "Inhala";
    /// <summary>Se dispara cada frame renderizado (para actualizar la UI).</summary>
    public event EventHandler? Ticked;

    private sealed class Amb { public double A, R, S, Size, Drift; public Brush Brush = null!; }
    private readonly List<Amb> _amb = new();
    private Pen[] _currentPens = Array.Empty<Pen>();
    private bool _hooked;
    private bool _paused;

    /// <summary>Si es true, deja de animar (para reduce-motion / modo estático). Congela el último frame.</summary>
    public bool Paused { get => _paused; set => _paused = value; }
    private readonly Random _rng = new(7);
    private long _start, _lastMs, _prev;
    private double _t;

    private Brush? _bgBrush;
    private Brush? _floorBrush;
    private double _cx, _cy, _w, _h;

    // Colores (del diseño).
    private static readonly Color Cyan = Color.FromRgb(117, 224, 239);
    // Halo suave compartido para que los puntitos se noten sobre el fondo.
    private static readonly SolidColorBrush AmbGlow = Frozen(new SolidColorBrush(Color.FromArgb(50, 117, 224, 239)));
    private static T Frozen<T>(T f) where T : Freezable { f.Freeze(); return f; }

    public PauseScene()
    {
        IsHitTestVisible = false;
        Loaded += (_, _) =>
        {
            if (_hooked) return; // una sola suscripción (evita handlers duplicados)
            Build();
            _start = _prev = Environment.TickCount64;
            CompositionTarget.Rendering += OnFrame;
            _hooked = true;
        };
        Unloaded += (_, _) =>
        {
            if (!_hooked) return;
            CompositionTarget.Rendering -= OnFrame;
            _hooked = false;
        };
        SizeChanged += (_, _) => Build();
    }

    private void Build()
    {
        _w = ActualWidth; _h = ActualHeight;
        if (_w < 2 || _h < 2) return;
        _cx = _w * 0.5; _cy = _h * 0.5; // centrado con Kanny
        double maxd = Math.Max(_w, _h);

        // Fondo radial verdoso-teal -> casi negro (absoluto para que sea circular).
        _bgBrush = new RadialGradientBrush
        {
            MappingMode = BrushMappingMode.Absolute,
            Center = new Point(_cx, _cy),
            GradientOrigin = new Point(_cx, _cy),
            RadiusX = maxd * 0.72,
            RadiusY = maxd * 0.72,
            GradientStops = new GradientStopCollection
            {
                new GradientStop(Color.FromRgb(0x10, 0x39, 0x45), 0.0),
                new GradientStop(Color.FromRgb(0x09, 0x1d, 0x29), 0.33),
                new GradientStop(Color.FromRgb(0x05, 0x0c, 0x16), 0.68),
                new GradientStop(Color.FromRgb(0x02, 0x05, 0x0b), 1.0),
            }
        };
        _bgBrush.Freeze();

        _floorBrush = new LinearGradientBrush(
            Color.FromArgb(0, 19, 79, 88), Color.FromArgb(82, 9, 38, 45), 90);
        _floorBrush.Freeze();

        _amb.Clear();
        for (int i = 0; i < 60; i++)
        {
            double alpha = 0.20 + _rng.NextDouble() * 0.35; // más visibles (antes 0.05–0.23)
            var brush = new SolidColorBrush(Color.FromArgb((byte)(alpha * 255), Cyan.R, Cyan.G, Cyan.B));
            brush.Freeze();
            _amb.Add(new Amb
            {
                A = _rng.NextDouble() * Math.PI * 2,
                R = 160 + _rng.NextDouble() * maxd * 0.5,
                S = 0.00005 + _rng.NextDouble() * 0.00012,
                Size = 1.3 + _rng.NextDouble() * 1.9, // un poco más grandes
                Drift = _rng.NextDouble() * Math.PI * 2,
                Brush = brush,
            });
        }

        // Plumas de las corrientes (color fijo) cacheadas.
        _currentPens = new Pen[3];
        for (int j = 0; j < 3; j++)
        {
            var pen = new Pen(new SolidColorBrush(Color.FromArgb((byte)((0.075 - j * 0.015) * 255), 54, 230, 238)), 1.1);
            pen.Freeze();
            _currentPens[j] = pen;
        }
    }

    private void OnFrame(object? sender, EventArgs e)
    {
        if (!IsVisible || _paused) return;
        long now = Environment.TickCount64;
        if (now - _lastMs < 1000.0 / Math.Max(1, TargetFps)) return;
        double dt = now - _prev; _prev = now; _lastMs = now;
        _t = now - _start;

        // Ciclo de respiración de 8 s.
        double cycle = (_t % 8000) / 8000.0;
        if (cycle < 0.375) { double q = cycle / 0.375; BreathScale = 0.96 + 0.055 * (0.5 - 0.5 * Math.Cos(Math.PI * q)); BreathPhase = "Inhala"; }
        else if (cycle < 0.5) { BreathScale = 1.015; BreathPhase = "Mantén"; }
        else { double q = (cycle - 0.5) / 0.5; BreathScale = 1.015 - 0.055 * (0.5 - 0.5 * Math.Cos(Math.PI * q)); BreathPhase = "Exhala"; }

        // Avanza órbitas.
        foreach (var p in _amb) p.A += p.S * 0.96 * dt;

        InvalidateVisual();
        Ticked?.Invoke(this, EventArgs.Empty);
    }

    protected override void OnRender(DrawingContext dc)
    {
        if (_bgBrush == null || _w < 2) return;
        var _sw = RenderDiagnostics.Enabled ? System.Diagnostics.Stopwatch.StartNew() : null;
        var full = new Rect(0, 0, _w, _h);
        dc.DrawRectangle(_bgBrush, null, full);
        dc.DrawRectangle(_floorBrush, null, new Rect(0, _h * 0.5, _w, _h * 0.5));

        double cycle = (_t % 8000) / 8000.0;

        // Corrientes bézier (3), fluyendo suave.
        for (int j = 0; j < 3; j++)
        {
            double y = _h * 0.72 + j * 22 + Math.Sin(_t * 0.00018 + j) * 10;
            var g = new StreamGeometry();
            using (var c = g.Open())
            {
                c.BeginFigure(new Point(-80, y), false, false);
                c.BezierTo(new Point(_w * 0.24, y - 70 - j * 12), new Point(_w * 0.33, y + 45), new Point(_w * 0.52, y - 10), true, false);
                c.BezierTo(new Point(_w * 0.68, y - 62), new Point(_w * 0.79, y + 42), new Point(_w + 80, y - 25), true, false);
            }
            g.Freeze();
            dc.DrawGeometry(null, _currentPens[j], g);
        }

        // Partículas ambientales orbitando (elipse ancha alrededor del centro).
        foreach (var p in _amb)
        {
            double wob = Math.Sin(_t * 0.0003 + p.Drift) * 8;
            double x = _cx + Math.Cos(p.A) * p.R;
            double y = _cy + Math.Sin(p.A) * p.R * 0.55 + wob;
            var pt = new Point(x, y);
            dc.DrawEllipse(AmbGlow, null, pt, p.Size * 2.6, p.Size * 2.6); // halo suave
            dc.DrawEllipse(p.Brush, null, pt, p.Size, p.Size);
        }

        // Efecto sonar: anillos de respiración que se expanden.
        for (int i = 0; i < 4; i++)
        {
            double local = (cycle + i * 0.22) % 1.0;
            double radius = 145 + local * 170;
            double alpha = (1 - local) * 0.12;
            var pen = new Pen(new SolidColorBrush(Color.FromArgb((byte)(alpha * 255), 72, 220, 230)), 1.2);
            dc.DrawEllipse(null, pen, new Point(_cx, _cy), radius, radius);
        }
        // Dos arcos parciales girando (no radar completo).
        double rot = _t * 0.00005;
        DrawArc(dc, _cx, _cy, 205, -0.4 + rot, 1.1 + rot, Color.FromArgb(51, 82, 229, 238), 1.4);
        DrawArc(dc, _cx, _cy, 236, 2.0 + rot, 3.35 + rot, Color.FromArgb(31, 79, 209, 197), 1.2);

        if (_sw != null) RenderDiagnostics.Frame(_sw.Elapsed.TotalMilliseconds);
    }

    private static void DrawArc(DrawingContext dc, double cx, double cy, double r, double a0, double a1, Color col, double w)
    {
        var g = new StreamGeometry();
        using (var c = g.Open())
        {
            var start = new Point(cx + Math.Cos(a0) * r, cy + Math.Sin(a0) * r);
            var end = new Point(cx + Math.Cos(a1) * r, cy + Math.Sin(a1) * r);
            bool large = (a1 - a0) > Math.PI;
            c.BeginFigure(start, false, false);
            c.ArcTo(end, new Size(r, r), 0, large, SweepDirection.Clockwise, true, false);
        }
        g.Freeze();
        dc.DrawGeometry(null, new Pen(new SolidColorBrush(col), w), g);
    }
}
