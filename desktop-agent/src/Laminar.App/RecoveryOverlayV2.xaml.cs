using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Threading;

namespace Laminar.App;

/// <summary>
/// Pausa activa V2 — DIÁLOGO INTERACTIVO. Kanny "habla" (texto tecleado en un globo),
/// con frases ligadas a la respiración, intro al abrir y clic sobre Kanny para
/// responderle con opciones. Todas las frases salen de un diccionario LOCAL
/// (DialoguePool) → cero tokens. Reutiliza la escena y Kanny de la V1.
/// </summary>
public partial class RecoveryOverlayV2 : Window
{
    private readonly DialoguePool _pool = new();
    private readonly DispatcherTimer _tick = new() { Interval = TimeSpan.FromSeconds(1) };
    // ~0.87x de velocidad (antes 30 ms) + pausas en puntuación para fluidez.
    private const int TypeBaseMs = 35;
    private readonly DispatcherTimer _typer = new() { Interval = TimeSpan.FromMilliseconds(TypeBaseMs) };
    private readonly DispatcherTimer _hide = new();
    private int _remaining;
    private string _fullLine = "";
    private int _typeIdx;
    private (string label, Action act)[]? _pending;
    private string _lastPhase = "";
    private int _introIdx;
    private bool _introDone;
    private bool _bubbleShown; // globo visible: no reemplazar la frase mientras se lee
    private readonly bool _reduced;

    /// <summary>True si la pausa llegó a su fin sola (no la cerró el usuario antes).</summary>
    public bool CompletedNaturally { get; private set; }

    public RecoveryOverlayV2(int durationSeconds, bool reducedMotion)
    {
        InitializeComponent();
        _remaining = Math.Min(Math.Max(durationSeconds, 60), 120);
        _reduced = reducedMotion;
        _tick.Tick += OnSecond;
        _typer.Tick += OnType;
        _hide.Tick += (_, _) => { _hide.Stop(); HideBubble(); };
        Loaded += OnLoaded;
    }

    private void OnLoaded(object? sender, RoutedEventArgs e)
    {
        Focus();
        Kanny.SetBreak(true);
        Scene.BeginAnimation(OpacityProperty, new DoubleAnimation(0.2, 0.85, new Duration(TimeSpan.FromSeconds(3.5))));
        Countdown.Text = TimeSpan.FromSeconds(_remaining).ToString(@"mm\:ss");
        Scene.Ticked += OnSceneTick;
        _tick.Start();
        SayIntroNext();
        if (_reduced)
        {
            var t = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(500) };
            t.Tick += (_, _) => { t.Stop(); Scene.Paused = true; Kanny.Paused = true; };
            t.Start();
        }
    }

    // ---- Intro ----
    private void SayIntroNext()
    {
        if (_introDone || _introIdx >= _pool.Intro.Length) { _introDone = true; return; }
        Say(_pool.Intro[_introIdx]);
        _introIdx++;
        var t = new DispatcherTimer { Interval = TimeSpan.FromSeconds(3.6) };
        t.Tick += (_, _) => { t.Stop(); SayIntroNext(); };
        t.Start();
    }

    // ---- Sincronía con la escena (respiración) ----
    private void OnSceneTick(object? sender, EventArgs e)
    {
        KannyScale.ScaleX = KannyScale.ScaleY = Scene.BreathScale;
        Phase.Text = Scene.BreathPhase;
        if (_introDone && !_typer.IsEnabled && !_bubbleShown && _pending == null && Choices.Children.Count == 0
            && Scene.BreathPhase != _lastPhase)
        {
            _lastPhase = Scene.BreathPhase;
            if (_pool.Chance(0.55)) Say(_pool.Next(Scene.BreathPhase));
        }
    }

    // ---- Diálogo ----
    private void Say(string line, (string label, Action act)[]? choices = null)
    {
        _typer.Stop(); _hide.Stop();
        _fullLine = line ?? ""; _typeIdx = 0; _pending = choices;
        LineText.Text = "";
        Choices.Children.Clear();
        ShowBubble();
        _typer.Start();
    }

    private void OnType(object? sender, EventArgs e)
    {
        if (_typeIdx < _fullLine.Length)
        {
            _typeIdx++;
            LineText.Text = _fullLine.Substring(0, _typeIdx);
            // Pausa natural según el carácter recién tecleado (fluidez, no de golpe).
            char c = _fullLine[_typeIdx - 1];
            int ms = c is '.' or '!' or '?' or '…' ? 300
                   : c is ',' or ';' or ':' ? 170
                   : c == ' ' ? 55
                   : TypeBaseMs;
            _typer.Interval = TimeSpan.FromMilliseconds(ms);
            return;
        }
        _typer.Interval = TimeSpan.FromMilliseconds(TypeBaseMs); // restablece para la próxima frase
        _typer.Stop();
        if (_pending != null) { SetChoices(_pending); _pending = null; }
        else
        {
            // Persiste la frase el tiempo suficiente para leerla con calma (según su largo).
            double hold = Math.Min(9.0, 3.4 + _fullLine.Length * 0.06);
            _hide.Interval = TimeSpan.FromSeconds(hold);
            _hide.Start();
        }
    }

    private void SetChoices((string label, Action act)[] items)
    {
        Choices.Children.Clear();
        foreach (var (label, act) in items)
        {
            var b = new Button { Content = label, Style = (Style)FindResource("ChoiceButton") };
            var action = act;
            b.Click += (_, _) => action();
            Choices.Children.Add(b);
        }
    }

    private void OnKannyClick(object sender, MouseButtonEventArgs e)
    {
        _introDone = true; // no seguir con la intro si el usuario ya interactúa
        Say(_pool.Next("click"), new (string, Action)[]
        {
            ("Estoy bien", () => Say("Me alegra. Una respiración más y sigues cuando quieras.")),
            ("Estoy tenso", () => Say("Está bien, no tienes que resolverlo ahora. Suelta los hombros conmigo.")),
            ("Quiero salir", Close),
        });
    }

    private void OnSecond(object? sender, EventArgs e)
    {
        _remaining--;
        if (_remaining <= 0)
        {
            _tick.Stop();
            CompletedNaturally = true; // la pausa llegó a su fin sola
            Say(_pool.Next("closing"), new (string, Action)[] { ("Terminar pausa", Close) });
            return;
        }
        Countdown.Text = TimeSpan.FromSeconds(_remaining).ToString(@"mm\:ss");
    }

    // ---- Animación del globo ----
    private void ShowBubble()
    {
        _bubbleShown = true;
        var dur = new Duration(TimeSpan.FromSeconds(0.34));
        var ease = new CubicEase { EasingMode = EasingMode.EaseOut };
        DialogueRoot.BeginAnimation(OpacityProperty, new DoubleAnimation(1, dur));
        BubbleScale.BeginAnimation(ScaleTransform.ScaleXProperty, new DoubleAnimation(1, dur) { EasingFunction = ease });
        BubbleScale.BeginAnimation(ScaleTransform.ScaleYProperty, new DoubleAnimation(1, dur) { EasingFunction = ease });
        BubbleShift.BeginAnimation(TranslateTransform.YProperty, new DoubleAnimation(0, dur) { EasingFunction = ease });
    }

    private void HideBubble()
    {
        _bubbleShown = false;
        var dur = new Duration(TimeSpan.FromSeconds(0.3));
        DialogueRoot.BeginAnimation(OpacityProperty, new DoubleAnimation(0, dur));
        BubbleScale.BeginAnimation(ScaleTransform.ScaleXProperty, new DoubleAnimation(0.92, dur));
        BubbleScale.BeginAnimation(ScaleTransform.ScaleYProperty, new DoubleAnimation(0.92, dur));
        BubbleShift.BeginAnimation(TranslateTransform.YProperty, new DoubleAnimation(18, dur));
    }

    private void OnKeyDown(object sender, System.Windows.Input.KeyEventArgs e) { if (e.Key == Key.Escape) Close(); }
    private void OnExit(object sender, RoutedEventArgs e) => Close();

    protected override void OnClosed(EventArgs e)
    {
        _tick.Stop(); _typer.Stop(); _hide.Stop();
        Scene.Ticked -= OnSceneTick;
        base.OnClosed(e);
    }
}
