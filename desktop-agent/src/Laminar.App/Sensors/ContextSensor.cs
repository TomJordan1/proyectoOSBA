using System;
using System.Runtime.InteropServices;
using Microsoft.Win32;

namespace Laminar.App;

/// <summary>
/// Detección de contexto CONTENT-BLIND: si la cámara o el micrófono están en uso
/// (proxy de "reunión"), y si la ventana en primer plano está a pantalla completa.
/// No lee títulos, procesos ni contenido: solo devuelve señales booleanas.
/// </summary>
public sealed class ContextSensor
{
    [StructLayout(LayoutKind.Sequential)]
    private struct RECT { public int Left, Top, Right, Bottom; }

    [DllImport("user32.dll")] private static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] private static extern bool GetWindowRect(IntPtr hWnd, out RECT r);
    [DllImport("user32.dll")] private static extern int GetSystemMetrics(int nIndex);
    private const int SM_CXSCREEN = 0, SM_CYSCREEN = 1;

    /// <summary>Cámara o micrófono en uso = probable reunión/llamada.</summary>
    public bool MeetingActive() => InUse("webcam") || InUse("microphone");

    // Windows anota el uso de cámara/micrófono por app en el registro.
    // LastUsedTimeStop == 0 significa "en uso ahora mismo".
    private static bool InUse(string capability)
    {
        try
        {
            string root = @"SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\" + capability;
            using var key = Registry.CurrentUser.OpenSubKey(root);
            if (key == null) return false;
            foreach (var sub in key.GetSubKeyNames())
            {
                using var appKey = key.OpenSubKey(sub);
                if (appKey == null) continue;
                if (IsActive(appKey)) return true;
                // Apps no empaquetadas cuelgan de una subclave adicional.
                foreach (var sub2 in appKey.GetSubKeyNames())
                {
                    using var k2 = appKey.OpenSubKey(sub2);
                    if (k2 != null && IsActive(k2)) return true;
                }
            }
        }
        catch { /* content-blind: ante cualquier duda, asume que no */ }
        return false;
    }

    private static bool IsActive(RegistryKey k)
        => k.GetValue("LastUsedTimeStop") is long stop && stop == 0;

    /// <summary>La ventana en primer plano ocupa toda la pantalla.</summary>
    public bool FullscreenActive()
    {
        var fg = GetForegroundWindow();
        if (fg == IntPtr.Zero) return false;
        if (!GetWindowRect(fg, out RECT r)) return false;
        int sw = GetSystemMetrics(SM_CXSCREEN);
        int sh = GetSystemMetrics(SM_CYSCREEN);
        return (r.Right - r.Left) >= sw && (r.Bottom - r.Top) >= sh;
    }
}
