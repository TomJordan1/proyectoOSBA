using System;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Threading;

namespace Laminar.App;

/// <summary>
/// Aviso suave (paso 1 de la intervención de dos pasos). No roba el foco (WS_EX_NOACTIVATE),
/// no tapa la pantalla y se coloca abajo a la derecha. Expone Accepted / Declined / Ignored.
/// Si el usuario no responde en unos segundos, se cierra solo (Ignored).
/// </summary>
public partial class NudgeWindow : Window
{
    private const int GWL_EXSTYLE = -20;
    private const int WS_EX_NOACTIVATE = 0x08000000;
    private const int WS_EX_TOOLWINDOW = 0x00000080;

    [DllImport("user32.dll")] private static extern int GetWindowLong(IntPtr hWnd, int nIndex);
    [DllImport("user32.dll")] private static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

    private readonly DispatcherTimer _autoClose = new() { Interval = TimeSpan.FromSeconds(9) };
    private bool _resolved;

    public event EventHandler? Accepted;
    public event EventHandler? Declined;
    public event EventHandler? Ignored;

    public NudgeWindow(string message)
    {
        InitializeComponent();
        Msg.Text = string.IsNullOrWhiteSpace(message) ? "¿Un respiro conmigo?" : message;
        _autoClose.Tick += (_, _) => { _autoClose.Stop(); Resolve(() => Ignored?.Invoke(this, EventArgs.Empty)); };
        Loaded += OnLoaded;
    }

    protected override void OnSourceInitialized(EventArgs e)
    {
        base.OnSourceInitialized(e);
        // No activar la ventana (no robar foco del trabajo del usuario).
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
        _autoClose.Start();
    }

    private void OnAccept(object sender, RoutedEventArgs e) => Resolve(() => Accepted?.Invoke(this, EventArgs.Empty));
    private void OnDecline(object sender, RoutedEventArgs e) => Resolve(() => Declined?.Invoke(this, EventArgs.Empty));

    private void Resolve(Action raise)
    {
        if (_resolved) return;
        _resolved = true;
        _autoClose.Stop();
        raise();
    }

    protected override void OnClosed(EventArgs e)
    {
        _autoClose.Stop();
        base.OnClosed(e);
    }
}
