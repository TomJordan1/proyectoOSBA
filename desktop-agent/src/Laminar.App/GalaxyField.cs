using System;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace Laminar.App;

/// <summary>
/// Fondo de estrellas calmado: puntos suaves que FLOTAN con transiciones tersas
/// (cada uno deriva alrededor de su posición con senoidales lentas). Sin líneas,
/// un solo color suave, buena resolución y 30 fps → nítido, suave y ligero. El
/// movimiento no es física: es una fórmula barata evaluada por frame (equivalente a
/// "leer" una animación pre-definida). Se pinta en un WriteableBitmap escalado.
/// </summary>
public sealed class GalaxyField : FrameworkElement
{
    public int ParticleCount { get; set; } = 120;
    public double TargetFps { get; set; } = 30;

    private WriteableBitmap? _bmp;
    private int _bw, _bh, _n;
    private long _lastMs;
    private double _t;

    private int[] _px = Array.Empty<int>();
    private int[] _bg = Array.Empty<int>();
    private double[] _hx = Array.Empty<double>(), _hy = Array.Empty<double>();
    private double[] _ax = Array.Empty<double>(), _ay = Array.Empty<double>();
    private double[] _sx = Array.Empty<double>(), _sy = Array.Empty<double>();
    private double[] _phx = Array.Empty<double>(), _phy = Array.Empty<double>();
    private byte[] _br = Array.Empty<byte>();
    private byte[] _rad = Array.Empty<byte>();

    private const int DotR = 205, DotG = 218, DotB = 248; // blanco azulado suave

    public GalaxyField()
    {
        IsHitTestVisible = false;
        Loaded += (_, _) => { Init(); CompositionTarget.Rendering += OnFrame; };
        Unloaded += (_, _) => CompositionTarget.Rendering -= OnFrame;
    }

    private void Init()
    {
        _bw = Math.Max(2, (int)(ActualWidth * 0.6));   // buena resolución (nítido)
        _bh = Math.Max(2, (int)(ActualHeight * 0.6));
        _bmp = new WriteableBitmap(_bw, _bh, 96, 96, PixelFormats.Bgra32, null);
        _px = new int[_bw * _bh];

        _bg = new int[_bw * _bh];
        for (int y = 0; y < _bh; y++)
        {
            double t = (double)y / _bh;
            int c = Rgb((int)(12 - t * 5), (int)(15 - t * 6), (int)(26 - t * 10));
            int row = y * _bw;
            for (int x = 0; x < _bw; x++) _bg[row + x] = c;
        }

        var rng = new Random(20260724);
        _n = Math.Max(12, ParticleCount);
        _hx = new double[_n]; _hy = new double[_n];
        _ax = new double[_n]; _ay = new double[_n];
        _sx = new double[_n]; _sy = new double[_n];
        _phx = new double[_n]; _phy = new double[_n];
        _br = new byte[_n]; _rad = new byte[_n];

        // Rejilla con jitter → buen espaciado.
        int cols = Math.Max(1, (int)Math.Round(Math.Sqrt(_n * (double)_bw / _bh)));
        double cw = (double)_bw / cols, ch = (double)_bh / Math.Ceiling((double)_n / cols);
        for (int i = 0; i < _n; i++)
        {
            int gx = i % cols, gy = i / cols;
            _hx[i] = (gx + 0.15 + rng.NextDouble() * 0.7) * cw;
            _hy[i] = (gy + 0.15 + rng.NextDouble() * 0.7) * ch;
            // Flotación suave: pequeña amplitud, velocidad MUY lenta (periodo ~15–45 s).
            _ax[i] = 5 + rng.NextDouble() * 12;
            _ay[i] = 5 + rng.NextDouble() * 12;
            _sx[i] = 0.004 + rng.NextDouble() * 0.010;
            _sy[i] = 0.004 + rng.NextDouble() * 0.010;
            _phx[i] = rng.NextDouble() * Math.PI * 2;
            _phy[i] = rng.NextDouble() * Math.PI * 2;
            double u = rng.NextDouble();
            _br[i] = (byte)(110 + u * u * 130);       // mayoría tenues, algunas brillantes
            _rad[i] = (byte)(_br[i] > 200 ? 2 : 1);
        }
    }

    private static int Rgb(int r, int g, int b) => (0xFF << 24) | (Clamp(r) << 16) | (Clamp(g) << 8) | Clamp(b);
    private static int Clamp(int v) => v < 0 ? 0 : (v > 255 ? 255 : v);

    private void OnFrame(object? sender, EventArgs e)
    {
        if (!IsVisible || _bmp == null) return;
        long now = Environment.TickCount64;
        if (now - _lastMs < 1000.0 / Math.Max(1, TargetFps)) return;
        _lastMs = now;
        _t += 1;

        Array.Copy(_bg, _px, _px.Length);
        for (int i = 0; i < _n; i++)
        {
            int x = (int)(_hx[i] + _ax[i] * Math.Sin(_t * _sx[i] + _phx[i]));
            int y = (int)(_hy[i] + _ay[i] * Math.Sin(_t * _sy[i] + _phy[i]));
            PlotDot(x, y, _rad[i], _br[i]);
        }
        _bmp.WritePixels(new Int32Rect(0, 0, _bw, _bh), _px, _bw * 4, 0);
        InvalidateVisual();
    }

    private void PlotDot(int px, int py, int rad, byte bright)
    {
        double a0 = bright / 255.0;
        for (int oy = -rad; oy <= rad; oy++)
        {
            int y = py + oy;
            if (y < 0 || y >= _bh) continue;
            int row = y * _bw;
            for (int ox = -rad; ox <= rad; ox++)
            {
                int x = px + ox;
                if (x < 0 || x >= _bw) continue;
                double a = a0 * (1 - Math.Sqrt(ox * ox + oy * oy) / (rad + 0.7));
                if (a <= 0) continue;
                int idx = row + x, c = _px[idx];
                int r0 = (c >> 16) & 0xFF, g0 = (c >> 8) & 0xFF, b0 = c & 0xFF;
                _px[idx] = Rgb((int)(r0 + (DotR - r0) * a), (int)(g0 + (DotG - g0) * a), (int)(b0 + (DotB - b0) * a));
            }
        }
    }

    protected override void OnRender(DrawingContext dc)
    {
        if (_bmp != null) dc.DrawImage(_bmp, new Rect(0, 0, ActualWidth, ActualHeight));
    }
}
