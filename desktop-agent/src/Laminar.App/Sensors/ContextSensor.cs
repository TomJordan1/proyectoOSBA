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

    // Estado de notificaciones de Windows: distingue pantalla completa REAL / presentación
    // de una simple ventana maximizada. (QUNS_RUNNING_D3D_FULL_SCREEN=3, QUNS_PRESENTATION_MODE=4)
    [DllImport("shell32.dll")] private static extern int SHQueryUserNotificationState(out int state);

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

    /// <summary>
    /// App a PANTALLA COMPLETA REAL o modo presentación (juego/vídeo/diapositivas),
    /// NO una simple ventana maximizada. Usa el estado de notificaciones de Windows,
    /// el mismo criterio que "No molestar" del sistema.
    /// </summary>
    public bool FullscreenActive()
    {
        try
        {
            if (SHQueryUserNotificationState(out int s) == 0)
                return s == 3 || s == 4; // D3D fullscreen o presentación
        }
        catch { /* ante cualquier duda, asume que NO está a pantalla completa */ }
        return false;
    }
}
