using System;
using System.Runtime.InteropServices;
using System.Threading;

namespace Laminar.App;

/// <summary>
/// Monitor de entrada CONTENT-BLIND. Cuenta señales abstractas: correcciones
/// (Backspace/Delete), cambios de ventana en primer plano, erraticidad del cursor
/// e inactividad. NUNCA registra qué teclas se pulsan, títulos de ventana, procesos
/// ni contenido. Usa polling (no instala hooks globales) para no parecer un keylogger.
/// </summary>
public sealed class InputMonitor : IDisposable
{
    [StructLayout(LayoutKind.Sequential)]
    private struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }
    [StructLayout(LayoutKind.Sequential)]
    private struct POINT { public int X; public int Y; }

    [DllImport("user32.dll")] private static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
    [DllImport("user32.dll")] private static extern short GetAsyncKeyState(int vKey);
    [DllImport("user32.dll")] private static extern bool GetCursorPos(out POINT lpPoint);
    [DllImport("user32.dll")] private static extern IntPtr GetForegroundWindow();
    [DllImport("kernel32.dll")] private static extern uint GetTickCount();

    private const int VK_BACK = 0x08;
    private const int VK_DELETE = 0x2E;
    private const int VK_SPACE = 0x20; // barra espaciadora: proxy no invasivo de "tecleo prolongado"

    private readonly Timer _poll;
    private readonly object _lock = new();

    // Acumuladores (protegidos por _lock).
    private long _corrections;
    private long _switches;
    private long _cursorTurns;
    private long _typing;            // pulsaciones de espacio (tecleo prolongado)
    private double _cursorDistance;

    // Estado de detección de flancos.
    private bool _backDown, _delDown, _spaceDown;
    private IntPtr _lastForeground;
    private POINT _lastCursor;
    private int _lastDx, _lastDy;
    private bool _hasCursor;

    public InputMonitor()
    {
        _poll = new Timer(Poll, null, 0, 60); // ~60 ms
    }

    private void Poll(object? _)
    {
      try
      {
        bool back = (GetAsyncKeyState(VK_BACK) & 0x8000) != 0;
        bool del = (GetAsyncKeyState(VK_DELETE) & 0x8000) != 0;
        bool space = (GetAsyncKeyState(VK_SPACE) & 0x8000) != 0;
        IntPtr fg = GetForegroundWindow();
        bool gotCursor = GetCursorPos(out POINT p);

        lock (_lock)
        {
            // Correcciones: flanco de bajada (una pulsación nueva).
            if (back && !_backDown) _corrections++;
            if (del && !_delDown) _corrections++;
            _backDown = back; _delDown = del;

            // Espacio: solo el conteo (nunca qué se escribe).
            if (space && !_spaceDown) _typing++;
            _spaceDown = space;

            // Cambio de ventana en primer plano (solo el handle, nunca el título).
            if (fg != IntPtr.Zero && _lastForeground != IntPtr.Zero && fg != _lastForeground) _switches++;
            _lastForeground = fg;

            // Erraticidad del cursor: distancia y cambios de dirección.
            if (gotCursor)
            {
                if (_hasCursor)
                {
                    int dx = p.X - _lastCursor.X;
                    int dy = p.Y - _lastCursor.Y;
                    double dist = Math.Sqrt(dx * dx + dy * dy);
                    // Filtra micro-jitter (<2px) y saltos enormes (>300px): cuando el CPU
                    // está saturado el timer de 60ms se amontona y el cursor "teletransporta"
                    // entre muestras, inflando giros/distancia sin ser fricción real.
                    if (dist >= 2 && dist <= 300)
                    {
                        _cursorDistance += dist;
                        if ((_lastDx != 0 || _lastDy != 0) && (dx * _lastDx + dy * _lastDy) < 0) _cursorTurns++;
                        _lastDx = dx; _lastDy = dy;
                    }
                }
                _lastCursor = p; _hasCursor = true;
            }
        }
      }
      catch { /* content-blind: un fallo puntual del sensor nunca tumba la app */ }
    }

    /// <summary>Segundos de inactividad del sistema (teclado + ratón).</summary>
    public double IdleSeconds()
    {
        var lii = new LASTINPUTINFO { cbSize = (uint)Marshal.SizeOf<LASTINPUTINFO>() };
        if (!GetLastInputInfo(ref lii)) return 0;
        return (GetTickCount() - lii.dwTime) / 1000.0;
    }

    public sealed record Snapshot(long Corrections, long Switches, long CursorTurns, long Typing, double CursorDistance, double IdleSeconds);

    /// <summary>Devuelve los acumulados desde la última llamada y los reinicia.</summary>
    public Snapshot TakeSnapshot()
    {
        lock (_lock)
        {
            var s = new Snapshot(_corrections, _switches, _cursorTurns, _typing, _cursorDistance, IdleSeconds());
            _corrections = 0; _switches = 0; _cursorTurns = 0; _typing = 0; _cursorDistance = 0;
            return s;
        }
    }

    public void Dispose() => _poll.Dispose();
}
