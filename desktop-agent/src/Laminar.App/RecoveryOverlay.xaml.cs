using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Shapes;
using System.Windows.Threading;

namespace Laminar.App;

/// <summary>
/// Recuperación breve con burbujas. NO bloquea el sistema: siempre se puede salir
/// (Esc o "Salir"), se autocierra en <=60 s y respeta 'reducir movimiento'.
/// Micro-respiro opcional, nunca coercitivo.
/// </summary>
public partial class RecoveryOverlay : Window
{
    private readonly DispatcherTimer _mover = new() { Interval = TimeSpan.FromMilliseconds(33) };
    private readonly DispatcherTimer _closer = new();
    private readonly List<(Ellipse e, double vy)> _bubbles = new();
    private readonly bool _reduced;
    private readonly Random _rng = new();

    public RecoveryOverlay(int durationSeconds, bool reducedMotion)
    {
        InitializeComponent();
        _reduced = reducedMotion;
        var secs = Math.Min(Math.Max(durationSeconds, 10), 60); // 10..60
        _closer.Interval = TimeSpan.FromSeconds(secs);
        _closer.Tick += (_, _) => Close();
        Loaded += OnLoaded;
    }

    private void OnLoaded(object? sender, RoutedEventArgs e)
    {
        Focus();
        _closer.Start();
        Msg.Text = RecoveryTips.Random();

        if (_reduced)
        {
            Hint.Text = "Pulsa Esc para salir";
            var calm = new Ellipse { Width = 140, Height = 140, Fill = new SolidColorBrush(Color.FromArgb(90, 79, 209, 197)) };
            Canvas.SetLeft(calm, ActualWidth / 2 - 70);
            Canvas.SetTop(calm, ActualHeight / 2 - 70);
            BubbleCanvas.Children.Add(calm);
            return;
        }

        for (var i = 0; i < 14; i++) SpawnBubble();
        _mover.Tick += Move;
        _mover.Start();
    }

    private void SpawnBubble()
    {
        double size = _rng.Next(30, 70);
        var b = new Ellipse
        {
            Width = size,
            Height = size,
            Fill = new SolidColorBrush(Color.FromArgb(120, 79, 209, 197)),
            Stroke = new SolidColorBrush(Color.FromArgb(160, 44, 122, 123)),
            StrokeThickness = 2,
            Cursor = System.Windows.Input.Cursors.Hand,
        };
        Canvas.SetLeft(b, _rng.NextDouble() * Math.Max(1, ActualWidth - size));
        Canvas.SetTop(b, ActualHeight + _rng.NextDouble() * ActualHeight);
        b.MouseLeftButtonDown += (_, _) => Pop(b);
        BubbleCanvas.Children.Add(b);
        _bubbles.Add((b, 0.8 + _rng.NextDouble() * 1.8));
    }

    private void Move(object? sender, EventArgs e)
    {
        for (var i = 0; i < _bubbles.Count; i++)
        {
            var (b, vy) = _bubbles[i];
            var top = Canvas.GetTop(b) - vy;
            if (top < -80) top = ActualHeight + 20;
            Canvas.SetTop(b, top);
        }
    }

    private void Pop(Ellipse b)
    {
        BubbleCanvas.Children.Remove(b);
        _bubbles.RemoveAll(x => x.e == b);
        if (_bubbles.Count == 0) Close();
    }

    private void OnKeyDown(object sender, System.Windows.Input.KeyEventArgs e) { if (e.Key == Key.Escape) Close(); }
    private void OnExit(object sender, RoutedEventArgs e) => Close();

    protected override void OnClosed(EventArgs e)
    {
        _mover.Stop();
        _closer.Stop();
        base.OnClosed(e);
    }
}
