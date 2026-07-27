# 🎨 DESIGN.md: Arquitectura Visual, UX y Copywriting para Kanny

## 1. Filosofía de Diseño y Paleta de Colores
La experiencia está construida bajo el principio de **"Calma Digital" (Calm Tech)**. La paleta de colores evita los tonos agresivos de alerta y utiliza tonos marinos oscuros con luces cian neón para reducir la fatiga visual.

* **Fondo Principal:** `#0B1120` (Azul Marino Profundo Nocturno).
* **Superficies & Tarjetas:** `rgba(15, 23, 42, 0.6)` con `backdrop-filter: blur(16px)` (Glassmorphism).
* **Acento Principal (Kanny Normal):** `#06B6D4` / `#22D3EE` (Cian Neón Resplandeciente).
* **Texto Principal:** `#F8FAFC` (Blanco Puro para alta legibilidad).
* **Texto Secundario:** `#94A3B8` (Gris Azulado Suave).

---

## 2. Estrategia de Copywriting (Basado en Líderes de IA)
Siguiendo el análisis de conversión de plataformas como *Reclaim.ai*, *Lindy.ai* y *Gumloop*[cite: 2]:

* **Hero Section (Lindy/Reclaim Framework):** En lugar de jerga abstracta sobre modelos de lenguaje, el copy se enfoca en el **retorno de tiempo y paz mental**: *"Recupera tu atención. Domina tu flujo."*[cite: 2]
* **Agitación del Problema (PAS Framework):** Contrasta los borrados frenéticos y la fatiga por burnout con la intervención silenciosa de Kanny[cite: 2].
* **Prueba Cuantitativa:** *"Save 1.5+ hours daily"* (Ahorra más de 1.5 horas de fatiga al día)[cite: 2].
* **Garantía de Privacidad (Gumloop/Zapier Framework):** *"100% On-Device execution"*. Todo el análisis de entropía ocurre en tu máquina sin enviar datos a la nube[cite: 2].

---

## 3. Arquitectura del Scrollytelling y Componentes UI

1. **Secuencia de Despertar (Awakening Overlay):**
   * **Inicio:** Pantalla oscura enfocada únicamente en Kanny en modo "Dormido" (ojos `- -`).
   * **Disparador:** Al hacer clic o al paso de 2 segundos, Kanny abre los ojos (`o o`), emite un resplandor cian expansivo y la interfaz principal realiza un *fade-in* suave.
2. **Navegación Glassmorphism:**
   * Navbar flotante con `backdrop-blur-md` y bordes translúcidos (`border-white/10`).
3. **Fondo de Partículas Interactivo:**
   * Canvas HTML5 que renderiza partículas que reaccionan vectorialmente al movimiento del cursor del usuario.
4. **Agente Flotante Interactivo al Scroll (GSAP ScrollTrigger):**
   * **Sección Hero:** Kanny centrado al $50\%$ de la pantalla.
   * **Sección "Qué Resuelve":** Kanny se desplaza a la derecha mientras la tarjeta de explicación aparece a la izquierda.
   * **Sección "Cómo lo Hace" (Simulador OS):** Kanny se desplaza a la izquierda abajo acompañando las pantallas simuladas.
5. **Tarjetas de Pricing Isométricas con Hover Interactivo:**
   * Diseño de baraja inclinada (`-rotate-6`, `rotate-0`, `rotate-6`).
   * **Interacción:** Al pasar el cursor (*hover*), la tarjeta seleccionada resalta, se endereza (`scale(1.08)`), y su `z-index` se incrementa para colocarse por encima de las demás.