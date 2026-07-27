using System;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media.Animation;
using System.Windows.Threading;

namespace Laminar.App;

/// <summary>
/// Pausa activa: escena de fondo (verdoso + sonar + partículas), Kanny centrado que
/// respira con el ritmo, y una guía de respiración (fase + cuenta regresiva). NO
/// bloquea el sistema: siempre se puede salir (Esc o "Salir").
/// </summary>
public partial class RecoveryOverlay : Window
{
    private readonly DispatcherTimer _tick = new() { Interval = TimeSpan.FromSeconds(1) };
    private int _remaining;
    private readonly bool _reduced;

    /// <summary>True si la pausa llegó a su fin sola (no la cerró el usuario antes).</summary>
    public bool CompletedNaturally { get; private set; }

    public RecoveryOverlay(int durationSeconds, bool reducedMotion)
    {
        InitializeComponent();
        _remaining = Math.Min(Math.Max(durationSeconds, 60), 120);
        _reduced = reducedMotion;
        _tick.Tick += OnSecond;
        Loaded += OnLoaded;
    }

    // Reduce-motion: tras dibujar unos frames, congela la escena y Kanny (frame estático).
    private void MaybeFreezeForReducedMotion()
    {
        if (!_reduced) return;
        var t = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(500) };
        t.Tick += (_, _) => { t.Stop(); Scene.Paused = true; Kanny.Paused = true; };
        t.Start();
    }

    private void OnLoaded(object? sender, RoutedEventArgs e)
    {
        Focus();
        Kanny.SetBreak(true);
        // El fondo entra poco a poco: translúcido 0.2 -> 0.85 (nunca 100%, se ve el
        // escritorio por detrás muy tenue).
        Scene.BeginAnimation(OpacityProperty, new DoubleAnimation(0.2, 0.85, new Duration(TimeSpan.FromSeconds(3.5))));
        Msg.Text = RecoveryTips.Random();
        Countdown.Text = TimeSpan.FromSeconds(_remaining).ToString(@"mm\:ss");
        Scene.Ticked += OnSceneTick;
        _tick.Start();
        MaybeFreezeForReducedMotion();
    }

    // Sincroniza la respiración de Kanny y la fase con la escena.
    private void OnSceneTick(object? sender, EventArgs e)
    {
        KannyScale.ScaleX = KannyScale.ScaleY = Scene.BreathScale;
        Phase.Text = Scene.BreathPhase;
    }

    private void OnSecond(object? sender, EventArgs e)
    {
        _remaining--;
        if (_remaining <= 0) { CompletedNaturally = true; Close(); return; }
        Countdown.Text = TimeSpan.FromSeconds(_remaining).ToString(@"mm\:ss");
    }

    private void OnKeyDown(object sender, System.Windows.Input.KeyEventArgs e) { if (e.Key == Key.Escape) Close(); }
    private void OnExit(object sender, RoutedEventArgs e) => Close();

    protected override void OnClosed(EventArgs e)
    {
        _tick.Stop();
        Scene.Ticked -= OnSceneTick;
        base.OnClosed(e);
    }
}
