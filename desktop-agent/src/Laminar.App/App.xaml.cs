using System.Drawing;
using System.Windows;
using Laminar.Domain;
using WinForms = System.Windows.Forms;
using WpfApplication = System.Windows.Application;

namespace Laminar.App;

/// <summary>
/// Laminar en segundo plano: mascota visible + icono de bandeja. Un bucle automático
/// (AgentLoop) observa y decide SOLO; los botones A–D son solo el modo demo manual.
/// </summary>
public partial class App : WpfApplication
{
    private WinForms.NotifyIcon _tray = null!;
    private WinForms.ToolStripMenuItem _pauseItem = null!;
    private MainWindow? _window;
    private MascotWindow? _mascot;
    private AgentLoop _loop = null!;
    private bool _paused;
    private bool _overlayOpen;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        _mascot = new MascotWindow();
        _mascot.Show();
        _mascot.Say("Laminar está activo 🙂");

        // Bucle automático con fuente simulada (se cambia por sensores reales luego).
        _loop = new AgentLoop(new SimulatedMetricsSource(), OnAutoDecision);

        _tray = new WinForms.NotifyIcon
        {
            Icon = SystemIcons.Application,
            Visible = true,
            Text = "Laminar — activo",
        };

        var menu = new WinForms.ContextMenuStrip();
        menu.Items.Add(new WinForms.ToolStripMenuItem("Abrir configuración", null, (_, _) => ShowWindow()));
        menu.Items.Add(new WinForms.ToolStripMenuItem("Mostrar/ocultar acompañante", null, (_, _) => ToggleMascot()));

        var presentItem = new WinForms.ToolStripMenuItem("Estoy presentando") { CheckOnClick = true };
        presentItem.CheckedChanged += (_, _) => { _loop.Presenting = presentItem.Checked; _mascot?.Say(presentItem.Checked ? "Modo presentación: no te interrumpiré." : "Presentación desactivada."); };
        menu.Items.Add(presentItem);

        var quietItem = new WinForms.ToolStripMenuItem("No molestar") { CheckOnClick = true };
        quietItem.CheckedChanged += (_, _) => { _loop.QuietMode = quietItem.Checked; };
        menu.Items.Add(quietItem);

        _pauseItem = new WinForms.ToolStripMenuItem("Pausar", null, (_, _) => TogglePause());
        menu.Items.Add(_pauseItem);
        menu.Items.Add(new WinForms.ToolStripSeparator());
        menu.Items.Add(new WinForms.ToolStripMenuItem("Salir de Laminar", null, (_, _) => ExitApp()));
        _tray.ContextMenuStrip = menu;
        _tray.DoubleClick += (_, _) => ShowWindow();

        _tray.ShowBalloonTip(2000, "Laminar", "Ejecutándose en segundo plano.", WinForms.ToolTipIcon.Info);
        _loop.Start();
    }

    // Qué hacer cuando el bucle decide SOLO.
    private void OnAutoDecision(DecisionResponse d, DecisionRequest req)
    {
        switch (d.Action)
        {
            case LaminarAction.launch_bubble_recovery:
                if (!_overlayOpen)
                {
                    _overlayOpen = true;
                    _mascot?.Say(RecoveryTips.Random());
                    var o = new RecoveryOverlay(d.Arguments.DurationSeconds ?? 45, req.Preferences.ReducedMotion);
                    o.Closed += (_, _) => _overlayOpen = false;
                    o.Show();
                }
                break;
            case LaminarAction.show_subtle_notification:
                _mascot?.Say("¿Un respiro? Detecté algo de fricción.");
                break;
            case LaminarAction.postpone_intervention:
                // Contexto protegido: no interrumpe ahora (se pospone).
                break;
            default:
                break;
        }
    }

    internal void ShowWindow()
    {
        _window ??= new MainWindow();
        _window.Show();
        _window.WindowState = WindowState.Normal;
        _window.Activate();
    }

    private void ToggleMascot()
    {
        _mascot ??= new MascotWindow();
        if (_mascot.IsVisible) _mascot.Hide();
        else { _mascot.Show(); _mascot.Activate(); }
    }

    private void TogglePause()
    {
        _paused = !_paused;
        _loop.Paused = _paused;
        _pauseItem.Text = _paused ? "Reanudar" : "Pausar";
        _tray.Text = _paused ? "Laminar — pausado" : "Laminar — activo";
        _mascot?.Say(_paused ? "Detección pausada." : "Detección reanudada.");
    }

    private void ExitApp()
    {
        _loop.Stop();
        _mascot?.Close();
        _tray.Visible = false;
        _tray.Dispose();
        Shutdown();
    }
}
