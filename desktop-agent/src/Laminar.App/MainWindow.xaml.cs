using System;
using System.ComponentModel;
using System.Windows;
using Laminar.Domain;
using Laminar.Friction;
using Laminar.AgentClient;

namespace Laminar.App;

public partial class MainWindow : Window
{
    private readonly FrictionOptions _options = new();
    private readonly MockAgentClient _client;
    private readonly ResponseValidator _validator;

    public MainWindow()
    {
        InitializeComponent();
        _client = new MockAgentClient(_options);
        _validator = new ResponseValidator(_options);
    }

    // Modo demo: cada botón lanza un escenario reproducible (datos marcados como demo).
    private async void OnScenario(object sender, RoutedEventArgs e)
    {
        var quiet = QuietMode.IsChecked == true;
        var reduced = ReducedMotion.IsChecked == true;
        var req = (sender as FrameworkElement)?.Name switch
        {
            "BtnA" => Build(0.30, 0, false, quiet, 90, "bubbles", reduced, 45),
            "BtnB" => Build(0.86, 6, false, quiet, 48, "bubbles", reduced, 45),
            "BtnC" => Build(0.88, 6, true,  quiet, 60, "bubbles", reduced, 45),
            "BtnD" => Build(0.80, 5, false, quiet, 20, "breathing", true, 30),
            _ => Build(0.30, 0, false, quiet, 90, "bubbles", reduced, 45)
        };

        var raw = await _client.DecideAsync(req);
        var d = _validator.Revalidate(raw, req.Context, DateTime.UtcNow); // doble validación
        ActionText.Text = d.Action.ToString();
        ReasonText.Text = d.Explanation;
        SourceText.Text = $"fuente: {d.DecisionSource} · reason_code: {d.ReasonCode} · fallback: {d.Fallback}";

        // Ejecuta la intervención visible cuando corresponde (demo tangible).
        if (d.Action == LaminarAction.launch_bubble_recovery)
        {
            var seconds = d.Arguments.DurationSeconds ?? 45;
            bool useV2 = AgentSettings.Load().UseV2; // respeta la config (v2 conversacional por defecto)
            Window ov = useV2
                ? new RecoveryOverlayV2(seconds, req.Preferences.ReducedMotion)
                : new RecoveryOverlay(seconds, req.Preferences.ReducedMotion);
            ov.Owner = this;
            ov.Show();
        }
    }

    private DecisionRequest Build(double score, int sustained, bool prot, bool quiet, int lastInt, string pref, bool rm, int maxDur) =>
        new("1.0", Guid.NewGuid().ToString(), DateTime.UtcNow.ToString("o"),
            new Laminar.Domain.Friction(score, sustained, 1.5, 1.6, 1.2),
            new DecisionContext(prot, prot, prot, quiet, 60, lastInt),
            new Preferences(pref, rm, maxDur));

    // "Ocultar": esconde la ventana a la bandeja; la app sigue en segundo plano.
    private void OnExit(object sender, RoutedEventArgs e) => Hide();

    // Cerrar con la X tampoco termina la app: la oculta a la bandeja.
    protected override void OnClosing(CancelEventArgs e)
    {
        e.Cancel = true;
        Hide();
        base.OnClosing(e);
    }
}
