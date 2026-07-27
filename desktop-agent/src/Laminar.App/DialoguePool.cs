using System;
using System.Collections.Generic;
using System.Linq;

namespace Laminar.App;

/// <summary>
/// Diccionario LOCAL de frases del acompañante, organizado por categoría (intro,
/// respiración, clic, cierre y respuestas). CERO tokens. Usa una "bolsa barajada"
/// por categoría: no repite una frase hasta agotar todas → variedad sin que el
/// usuario sienta que es siempre lo mismo. (Se puede refrescar el pool con una sola
/// llamada a la IA al día en el futuro; ver NEXT_SESSION.)
/// </summary>
public sealed class DialoguePool
{
    // Valores por defecto (fallback si no hay kanny.frases.json o le falta una categoría).
    private static readonly Dictionary<string, string[]> Defaults = new()
    {
        ["intro"] = new[]
        {
            "Hey… llevas un buen rato frente a la pantalla.",
            "No tienes que parar todo. Solo regálame unos segundos.",
            "Vamos juntos, afloja un poquito los hombros.",
        },
        ["Inhala"] = new[]
        {
            "Toma aire conmigo… despacio, sin esfuerzo.",
            "Deja que el pecho se abra suavemente.",
            "Inhala como si llenaras una pequeña burbuja de calma.",
            "Aire nuevo, tranquilo… entra a tu ritmo.",
        },
        ["Mantén"] = new[]
        {
            "Quédate aquí un instante. No hay prisa.",
            "Solo siente la pausa… yo cuento contigo.",
            "Muy bien. Este pequeño silencio también ayuda.",
        },
        ["Exhala"] = new[]
        {
            "Ahora suelta el aire… y deja caer la tensión.",
            "Exhala lento. Imagina que el cansancio se aleja.",
            "Eso es… no tienes que cargar todo a la vez.",
        },
        ["click"] = new[]
        {
            "¡Te sentí! ¿Cómo va esa pausa?",
            "Aquí estoy. ¿Otra respiración conmigo?",
            "Gracias por responderme. Eso me da energía ✦",
        },
        ["closing"] = new[]
        {
            "Lo hiciste muy bien. Vuelve cuando te sientas listo.",
            "Gracias por este ratito. Nos vemos en la próxima pausa ✦",
        },
    };

    // Frases efectivas = por defecto, sobreescritas por kanny.frases.json cuando exista.
    private readonly Dictionary<string, string[]> _cats;

    public DialoguePool()
    {
        _cats = new Dictionary<string, string[]>();
        foreach (var kv in Defaults)
            _cats[kv.Key] = PhraseConfig.Get(kv.Key, kv.Value);
    }

    private readonly Dictionary<string, List<int>> _bag = new();
    private readonly Random _rng = new();

    public string[] Intro => _cats["intro"];

    /// <summary>Devuelve una frase de la categoría sin repetir hasta agotar la bolsa.</summary>
    public string Next(string category)
    {
        if (!_cats.TryGetValue(category, out var arr) || arr.Length == 0) return "";
        if (!_bag.TryGetValue(category, out var bag) || bag.Count == 0)
        {
            bag = Enumerable.Range(0, arr.Length).OrderBy(_ => _rng.Next()).ToList();
            _bag[category] = bag;
        }
        int idx = bag[0];
        bag.RemoveAt(0);
        return arr[idx];
    }

    public bool Chance(double p) => _rng.NextDouble() < p;
}
