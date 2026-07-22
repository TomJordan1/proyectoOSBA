using System;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;

namespace Laminar.App;

/// <summary>
/// Acompañante visible de Laminar: una pequeña mascota flotante, sin bordes,
/// siempre encima y arrastrable. Es la presencia del agente en segundo plano.
/// Placeholder vectorial: se puede reemplazar por un sprite/GIF pixelado.
/// </summary>
public partial class MascotWindow : Window
{
    private readonly DispatcherTimer _bubbleTimer = new() { Interval = TimeSpan.FromSeconds(4) };

    public MascotWindow()
    {
        InitializeComponent();
        _bubbleTimer.Tick += (_, _) => { Bubble.Visibility = Visibility.Collapsed; _bubbleTimer.Stop(); };
        Loaded += (_, _) => MoveToCorner();
    }

    private void MoveToCorner()
    {
        var wa = SystemParameters.WorkArea;
        Left = wa.Right - Width - 24;
        Top = wa.Bottom - Height - 24;
    }

    /// <summary>Muestra un mensaje breve sobre la mascota (p. ej. al detectar fricción).</summary>
    public void Say(string text)
    {
        BubbleText.Text = text;
        Bubble.Visibility = Visibility.Visible;
        _bubbleTimer.Stop();
        _bubbleTimer.Start();
    }

    private void OnDrag(object sender, MouseButtonEventArgs e)
    {
        if (e.ButtonState == MouseButtonState.Pressed && e.ClickCount == 1)
        {
            try { DragMove(); } catch { /* ignore */ }
        }
    }

    private void OnOpenConfig(object sender, RoutedEventArgs e)
    {
        (Application.Current as App)?.ShowWindow();
    }

    private void OnHide(object sender, RoutedEventArgs e) => Hide();
}
