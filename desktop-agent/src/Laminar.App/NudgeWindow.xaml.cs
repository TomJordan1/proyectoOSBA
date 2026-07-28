using System;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Threading;

namespace Laminar.App;

/// <summary>
/// Aviso con ANILLO de cuenta regresiva (8 s). No roba el foco (WS_EX_NOACTIVATE).
/// El arco recorre el círculo mientras la cuenta baja; al completarse entra la pausa
/// (Accepted), salvo que el usuario pulse "Cancelar" (Declined) o "Pausar ahora".
/// </summary>
public partial class NudgeWindow : Window
{
    private const int GWL_EXSTYLE = -20;
    private const int WS_EX_NOACTIVATE = 0x08000000;
    private const int WS_EX_TOOLWINDOW = 0x00000080;

    [DllImport("user32.dll")] private static extern int GetWindowLong(IntPtr hWnd, int nIndex);
    [DllImport("user32.dll")] private static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

    private const double TotalSeconds = 6.0;
    // Geometría del anillo (coordenadas del Canvas 100x100).
    private const double Cx = 50, Cy = 50, R = 40;

    private readonly DispatcherTimer _tick = new() { Interval = TimeSpan.FromMilliseconds(60) };
    private DateTime _start;
    private bool _resolved;

    public event EventHandler? Accepted;
    public event EventHandler? Declined;

    public NudgeWindow(string message)
    {
        InitializeComponent();
        if (!string.IsNullOrWhiteSpace(message)) Msg.Text = message;
        _tick.Tick += OnTick;
        Loaded += OnLoaded;
    }

    protected override void OnSourceInitialized(EventArgs e)
    {
        base.OnSourceInitialized(e);
        var handle = new WindowInteropHelper(this).Handle;
        int ex = GetWindowLong(handle, GWL_EXSTYLE);
        SetWindowLong(handle, GWL_EXSTYLE, ex | WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW);
    }

    private void OnLoaded(object? sender, RoutedEventArgs e)
    {
        UpdateLayout();
        var wa = SystemParameters.WorkArea;
        Left = wa.Right - ActualWidth - 24;
        Top = wa.Bottom - ActualHeight - 24;
        _start = DateTime.UtcNow;
        UpdateArc(0);
        _tick.Start();
    }

    private void OnTick(object? sender, EventArgs e)
    {
        double elapsed = (DateTime.UtcNow - _start).TotalSeconds;
        double frac = Math.Clamp(elapsed / TotalSeconds, 0, 1);
        UpdateArc(frac);
        Count.Text = Math.Max(0, Math.Ceiling(TotalSeconds - elapsed)).ToString("0");
        if (elapsed >= TotalSeconds)
            Resolve(() => Accepted?.Invoke(this, EventArgs.Empty)); // no canceló → entra la pausa
    }

    // Dibuja el arco recorriendo el círculo en sentido horario (empieza arriba).
    private void UpdateArc(double frac)
    {
        if (frac <= 0.0001) { Arc.Data = null; return; }
        if (frac >= 1.0) frac = 0.9999; // evita el arco de 360° exacto (degenera)
        double s = frac * 360.0;
        double rad = s * Math.PI / 180.0;
        double endX = Cx + R * Math.Sin(rad);
        double endY = Cy - R * Math.Cos(rad);
        var fig = new PathFigure { StartPoint = new Point(Cx, Cy - R), IsClosed = false, IsFilled = false };
        fig.Segments.Add(new ArcSegment(new Point(endX, endY), new Size(R, R), 0, s > 180, SweepDirection.Clockwise, true));
        var geo = new PathGeometry();
        geo.Figures.Add(fig);
        geo.Freeze();
        Arc.Data = geo;
    }

    private void OnAccept(object sender, RoutedEventArgs e) => Resolve(() => Accepted?.Invoke(this, EventArgs.Empty));
    private void OnDecline(object sender, RoutedEventArgs e) => Resolve(() => Declined?.Invoke(this, EventArgs.Empty));

    private void Resolve(Action raise)
    {
        if (_resolved) return;
        _resolved = true;
        _tick.Stop();
        raise();
    }

    protected override void OnClosed(EventArgs e)
    {
        _tick.Stop();
        base.OnClosed(e);
    }
}
