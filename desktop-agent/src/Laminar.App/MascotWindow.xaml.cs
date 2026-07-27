using System;
using System.Windows;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Threading;

namespace Laminar.App;

/// <summary>
/// Acompañante visible de Laminar (Kanny): flotante, sin bordes, siempre encima y
/// arrastrable. El dibujo lo hace <see cref="KannyView"/> (port fiel del diseño);
/// esta ventana solo lo aloja, muestra mensajes y reenvía el estado (estrés) real.
/// </summary>
public partial class MascotWindow : Window
{
    private readonly DispatcherTimer _bubbleTimer = new() { Interval = TimeSpan.FromSeconds(4) };
    // Luz ambiental: cada 3 s (no por frame) para no penalizar el rendimiento.
    private readonly DispatcherTimer _ambientTimer = new() { Interval = TimeSpan.FromSeconds(3) };

    public MascotWindow()
    {
        InitializeComponent();
        _bubbleTimer.Tick += (_, _) => { Bubble.Visibility = Visibility.Collapsed; _bubbleTimer.Stop(); };
        _ambientTimer.Tick += (_, _) => SampleAmbient();
        Loaded += (_, _) => { MoveToCorner(); SampleAmbient(); _ambientTimer.Start(); };
        Closed += (_, _) => _ambientTimer.Stop();
    }

    // Ajusta el contraste de Kanny al brillo del fondo (content-blind: solo luminancia).
    private void SampleAmbient()
    {
        try
        {
            var handle = new WindowInteropHelper(this).Handle;
            double lum = AmbientBrightness.SampleForWindow(handle);
            if (lum >= 0) Kanny.SetAmbient(lum);
        }
        catch { /* si el muestreo falla, Kanny mantiene su contraste actual */ }
    }

    private void MoveToCorner()
    {
        var wa = SystemParameters.WorkArea;
        Left = wa.Right - Width - 24;
        Top = wa.Bottom - Height - 24;
    }

    /// <summary>0 = calmado, 1 = muy frustrado. El agente lo llama cada tick.</summary>
    public void SetStress(double s) => Kanny.SetStress(s);

    /// <summary>Modo descanso (durante una recuperación): Kanny se calma.</summary>
    public void SetResting(bool resting) => Kanny.SetBreak(resting);

    /// <summary>Muestra un mensaje breve sobre la mascota.</summary>
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
