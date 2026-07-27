using System;
using System.Runtime.InteropServices;

namespace Laminar.App;

/// <summary>
/// Sensor de LUZ AMBIENTAL content-blind: promedia la luminancia de ~8 puntos ALREDEDOR
/// del acompañante (sobre el fondo, no sobre el cuerpo) para que Kanny ajuste su contraste
/// a fondos claros u oscuros. NO captura ni guarda ni envía contenido: solo un número de
/// brillo [0..1], efímero, en local. Equivale a un sensor de brillo, no a leer la pantalla.
/// </summary>
internal static class AmbientBrightness
{
    [StructLayout(LayoutKind.Sequential)]
    private struct RECT { public int Left, Top, Right, Bottom; }

    [DllImport("user32.dll")] private static extern IntPtr GetDC(IntPtr hWnd);
    [DllImport("user32.dll")] private static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);
    [DllImport("user32.dll")] private static extern bool GetWindowRect(IntPtr hWnd, out RECT r);
    [DllImport("gdi32.dll")] private static extern uint GetPixel(IntPtr hdc, int x, int y);

    private const uint CLR_INVALID = 0xFFFFFFFF;

    /// <summary>
    /// Luminancia promedio [0..1] del fondo alrededor de la ventana dada. 0 = fondo oscuro,
    /// 1 = fondo claro. Devuelve -1 si no se puede muestrear.
    /// </summary>
    public static double SampleForWindow(IntPtr hwnd)
    {
        if (hwnd == IntPtr.Zero || !GetWindowRect(hwnd, out RECT r)) return -1;
        int cx = (r.Left + r.Right) / 2;
        int cy = (r.Top + r.Bottom) / 2;
        int radius = Math.Max(8, (int)((r.Right - r.Left) * 0.42)); // fuera del cuerpo, sobre el fondo

        IntPtr hdc = GetDC(IntPtr.Zero);
        if (hdc == IntPtr.Zero) return -1;
        try
        {
            double sum = 0; int n = 0;
            for (int i = 0; i < 8; i++)
            {
                double a = i / 8.0 * Math.PI * 2;
                int x = cx + (int)(Math.Cos(a) * radius);
                int y = cy + (int)(Math.Sin(a) * radius);
                uint c = GetPixel(hdc, x, y);
                if (c == CLR_INVALID) continue;
                int rr = (int)(c & 0xFF), gg = (int)((c >> 8) & 0xFF), bb = (int)((c >> 16) & 0xFF);
                sum += (0.299 * rr + 0.587 * gg + 0.114 * bb) / 255.0;
                n++;
            }
            return n > 0 ? sum / n : -1;
        }
        catch { return -1; }
        finally { ReleaseDC(IntPtr.Zero, hdc); }
    }
}
