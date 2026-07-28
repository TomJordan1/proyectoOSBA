using System;
using System.Drawing;
using System.IO;
using System.Windows;
using Laminar.Domain;
using Laminar.Friction;
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
    private AgentSettings _settings = null!;
    private readonly InterventionBackoff _backoff = new();
    private NudgeWindow? _nudge;
    private bool _paused;
    private bool _overlayOpen;
    private bool _hiddenByContext;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        _mascot = new MascotWindow();
        _mascot.Show();

        // Cliente de decisión: si hay API configurada en el entorno, usa el backend en
        // vivo (IA real); si no, cae al modo demo local. La API key NUNCA va en el repo:
        // se lee de variables de entorno (LAMINAR_API_BASE_URL, LAMINAR_API_KEY).
        _settings = AgentSettings.Load();
        IAgentClient? client = null;
        string modeMsg;
        if (_settings.HasCloud)
        {
            client = new Laminar.AgentClient.HttpAgentClient(new System.Net.Http.HttpClient(), _settings.ApiBaseUrl, _settings.ApiKey, _settings.TrialCode);
            modeMsg = "Kandace activo — IA en la nube 🙂";
        }
        else
        {
            modeMsg = "Kandace activo — modo demo local 🙂";
        }
        // Sensores reales (content-blind) por defecto en el agente distribuido.
        var useReal = _settings.UseRealSensors;
        IMetricsSource source;
        ContextSensor? contextSensor = null;
        try
        {
            if (useReal)
            {
                source = new RealMetricsSource();
                contextSensor = new ContextSensor();
                modeMsg += " · sensores reales";
            }
            else
            {
                source = new SimulatedMetricsSource();
                modeMsg += " · demo simulada";
            }
        }
        catch (System.Exception ex)
        {
            // Si los sensores reales fallan, no tumbamos la app: caemos a simulado.
            source = new SimulatedMetricsSource();
            contextSensor = null;
            modeMsg += " · demo (sensor: " + ex.GetType().Name + ")";
        }
        // Primera vez: Kanny se presenta y explica cómo ayuda y cómo ocultarlo/pausarlo.
        // Siguientes veces: solo el mensaje breve de estado.
        if (OnboardingDone()) _mascot.Say(modeMsg);
        else StartOnboarding();

        // Bucle automático: fuente (real/simulada) + contexto real + estrés al acompañante +
        // aviso de contexto protegido (para ocultar a Kanny en reunión/pantalla completa).
        _loop = new AgentLoop(source, OnAutoDecision, client, contextSensor,
            onStress: score => _mascot?.SetStress(score),
            onProtected: OnContextProtected);

        _tray = new WinForms.NotifyIcon
        {
            Icon = TrayIcon(),
            Visible = true,
            Text = "Kandace — activo",
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
        menu.Items.Add(new WinForms.ToolStripMenuItem("Salir de Kandace", null, (_, _) => ExitApp()));
        _tray.ContextMenuStrip = menu;
        _tray.DoubleClick += (_, _) => ShowWindow();

        _tray.ShowBalloonTip(2000, "Kandace", "Ejecutándose en segundo plano.", WinForms.ToolTipIcon.Info);
        _loop.Start();
    }

    // Qué hacer cuando el bucle decide SOLO.
    private void OnAutoDecision(DecisionResponse d, DecisionRequest req)
    {
        switch (d.Action)
        {
            case LaminarAction.launch_bubble_recovery:
                OfferRecovery(d, req);
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

    // PASO 1: aviso suave (no roba foco, no tapa la pantalla). La pausa completa solo si el
    // usuario acepta. Ignorar/declinar/cerrar rápido alimentan el back-off (menos insistencia).
    private void OfferRecovery(DecisionResponse d, DecisionRequest req)
    {
        if (_overlayOpen || _nudge != null || _backoff.IsSnoozed) return;

        int dur = d.Arguments.DurationSeconds ?? 45;
        bool reduced = req.Preferences.ReducedMotion;

        _nudge = new NudgeWindow(""); // sin frase: solo "La pantalla se bloqueará en:" + el anillo
        _nudge.Accepted += (_, _) => { CloseNudge(); OpenRecovery(dur, reduced); };
        _nudge.Declined += (_, _) => { CloseNudge(); _backoff.RegisterDeclined(); ApplySnooze(); _mascot?.Say("Sin problema, seguimos."); };
        _nudge.Show();

        // Gracia base: no volver a ofrecer mientras el aviso está en pantalla.
        _backoff.RegisterShown();
        ApplySnooze();
    }

    private void CloseNudge()
    {
        if (_nudge == null) return;
        try { _nudge.Close(); } catch { /* ya cerrada */ }
        _nudge = null;
    }

    // PASO 2: pausa completa (solo tras consentimiento). Al cerrar, mide la reacción:
    // completada = buena señal (reset); cierre <3s = molestó (escala el silencio); intermedio = suave.
    private void OpenRecovery(int dur, bool reduced)
    {
        _overlayOpen = true;
        _mascot?.SetResting(true); // Kanny se calma durante la pausa
        var shownAt = DateTime.UtcNow;
        Window o = _settings.UseV2 ? new RecoveryOverlayV2(dur, reduced) : new RecoveryOverlay(dur, reduced);
        o.Closed += (_, _) =>
        {
            _overlayOpen = false;
            _mascot?.SetResting(false);
            double elapsed = (DateTime.UtcNow - shownAt).TotalSeconds;
            bool completed = (o as RecoveryOverlay)?.CompletedNaturally
                             ?? (o as RecoveryOverlayV2)?.CompletedNaturally ?? false;
            if (completed) _backoff.RegisterCompleted();
            else if (elapsed < 3) _backoff.RegisterQuickDismiss();
            else _backoff.RegisterPartial();
            ApplySnooze();
        };
        o.Show();
    }

    private void ApplySnooze() => _loop.Snooze(_backoff.SnoozedUntil);

    // Oculta a Kanny en reunión/pantalla completa; lo restaura al salir de ese contexto
    // (sin pelear con un ocultar manual del usuario).
    private void OnContextProtected(bool protectedNow)
    {
        if (_mascot == null) return;
        if (protectedNow && _mascot.IsVisible) { _mascot.Hide(); _hiddenByContext = true; }
        else if (!protectedNow && _hiddenByContext) { _mascot.Show(); _hiddenByContext = false; }
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
        _tray.Text = _paused ? "Kandace — pausado" : "Kandace — activo";
        _mascot?.Say(_paused ? "Detección pausada." : "Detección reanudada.");
    }

    // Ícono de la bandeja: se toma del propio ejecutable (definido por ApplicationIcon
    // en el .csproj). Si por algún motivo no se puede leer, cae al ícono genérico.
    private static Icon TrayIcon()
    {
        try
        {
            var path = System.Environment.ProcessPath;
            if (!string.IsNullOrEmpty(path))
            {
                var ico = Icon.ExtractAssociatedIcon(path);
                if (ico != null) return ico;
            }
        }
        catch { /* fallback abajo */ }
        return SystemIcons.Application;
    }

    // --- Bienvenida guiada por Kanny (solo la primera vez) ---
    private static string OnboardFlagPath()
    {
        var dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Kandace");
        return Path.Combine(dir, "onboarded.flag");
    }

    private static bool OnboardingDone()
    {
        try { return File.Exists(OnboardFlagPath()); } catch { return true; }
    }

    private static void MarkOnboarded()
    {
        try
        {
            var p = OnboardFlagPath();
            Directory.CreateDirectory(Path.GetDirectoryName(p)!);
            File.WriteAllText(p, DateTime.UtcNow.ToString("o"));
        }
        catch { /* si no se puede escribir, se re-mostrará; sin drama */ }
    }

    private void StartOnboarding()
    {
        string[] msgs =
        {
            "¡Hola! Soy Kanny 🫧 Voy a acompañarte mientras trabajas.",
            "Observo tu ritmo — nunca lo que escribes — y si te noto tenso mucho rato, te propongo una pausa breve.",
            "Todo es privado y local: tu contenido siempre es solo tuyo.",
            "Las pausas son una invitación, nunca una obligación. Tú decides.",
            "¿Necesitas espacio? Clic derecho en mi ícono de la bandeja: Mostrar/ocultar, No molestar o Pausar.",
            "Estaré por aquí cuando me necesites. ✦",
        };
        int i = 0;
        _mascot?.Say(msgs[i++]);
        var timer = new System.Windows.Threading.DispatcherTimer { Interval = TimeSpan.FromSeconds(4.8) };
        timer.Tick += (_, _) =>
        {
            if (i >= msgs.Length) { timer.Stop(); MarkOnboarded(); return; }
            _mascot?.Say(msgs[i++]);
        };
        timer.Start();
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
