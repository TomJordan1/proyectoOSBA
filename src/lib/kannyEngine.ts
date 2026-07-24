/**
 * Kanny Engine
 *
 * Canvas-based renderer for the "Kanny" character: a wobbling glass-like
 * blob with internal physics-driven particles and cursor-tracking eyes.
 * Designed to run inside arbitrarily sized React canvases (each instance
 * owns one <canvas>). Sizes are tuned against a 150px reference radius and
 * scaled proportionally to whatever container the orb is mounted in.
 */

export type KannyStateName = 'afk' | 'normal' | 'erratic' | 'break'

interface KannyStateParams {
  particleSpeed: number
  chaos: number
  orbit: number
  glow: number
  wobbleAmt: number
  wobbleSpeed: number
  connectionThreshold: number
  waveMode: number
  bounceMode: number
  eyeSep: number
  eyeScale: number
  eyeTilt: number
  floatAmp: number
  colorR: number
  colorG: number
  colorB: number
}

// Values below are tuned against a reference radius of 150px (same as the
// original prototype) and get scaled at render time to fit the actual orb.
const REFERENCE_RADIUS = 150

const KANNY_STATES: Record<KannyStateName, KannyStateParams> = {
  afk: {
    particleSpeed: 0.8,
    chaos: 0,
    orbit: 1.5,
    glow: 15,
    wobbleAmt: 2,
    wobbleSpeed: 0.02,
    connectionThreshold: 0,
    waveMode: 0,
    bounceMode: 0,
    eyeSep: 30,
    eyeScale: 2.0,
    eyeTilt: 0,
    floatAmp: 10,
    colorR: 0,
    colorG: 200,
    colorB: 220,
  },
  normal: {
    particleSpeed: 0.4,
    chaos: 0,
    orbit: 0,
    glow: 25,
    wobbleAmt: 3,
    wobbleSpeed: 0.05,
    connectionThreshold: 0,
    waveMode: 1.0,
    bounceMode: 0,
    eyeSep: 35,
    eyeScale: 2.2,
    eyeTilt: 0,
    floatAmp: 5,
    colorR: 0,
    colorG: 240,
    colorB: 255,
  },
  erratic: {
    particleSpeed: 3.5,
    chaos: 1.0,
    orbit: 0,
    glow: 60,
    wobbleAmt: 25,
    wobbleSpeed: 0.2,
    connectionThreshold: 90,
    waveMode: 0,
    bounceMode: 1.0,
    eyeSep: 45,
    eyeScale: 2.8,
    eyeTilt: 0.2,
    floatAmp: 2,
    colorR: 50,
    colorG: 255,
    colorB: 255,
  },
  break: {
    particleSpeed: 0.1,
    chaos: 0,
    orbit: 0.05,
    glow: 5,
    wobbleAmt: 0,
    wobbleSpeed: 0,
    connectionThreshold: 0,
    waveMode: 0,
    bounceMode: 0,
    eyeSep: 22,
    eyeScale: 0.5,
    eyeTilt: 0,
    floatAmp: 15,
    colorR: 0,
    colorG: 100,
    colorB: 120,
  },
}

interface PointerLocal {
  x: number
  y: number
}

class KannyParticle {
  x = 0
  y = 0
  vx = 0
  vy = 0
  baseRadius = 0
  radius = 0
  baseAlpha = 0
  alpha = 0
  zDepth = 0
  wavePhase = 0
  waveFreq = 0
  waveLane = 0
  waveDir = 0

  constructor(kannyRadius: number) {
    this.reset(kannyRadius)
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * kannyRadius
    this.x = Math.cos(angle) * radius
    this.y = Math.sin(angle) * radius
  }

  reset(kannyRadius: number) {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * (kannyRadius * 0.5)
    this.x = Math.cos(angle) * radius
    this.y = Math.sin(angle) * radius

    const vAngle = Math.random() * Math.PI * 2
    this.vx = Math.cos(vAngle)
    this.vy = Math.sin(vAngle)

    this.baseRadius = 1.5 + Math.random() * 2.5
    this.radius = this.baseRadius
    this.baseAlpha = 0.3 + Math.random() * 0.7
    this.alpha = this.baseAlpha

    this.zDepth = Math.random()

    this.wavePhase = Math.random() * Math.PI * 2
    this.waveFreq = 0.8 + Math.random() * 1.2
    this.waveLane = (Math.random() - 0.5) * 2
    this.waveDir = Math.random() * Math.PI * 2
  }

  update(params: KannyStateParams, kannyRadius: number, waveTime: number, jitterScale: number) {
    let jitterX = 0
    let jitterY = 0
    if (params.chaos > 0) {
      jitterX = (Math.random() - 0.5) * params.chaos * 5 * jitterScale
      jitterY = (Math.random() - 0.5) * params.chaos * 5 * jitterScale
    }

    if (params.bounceMode > 0.5) {
      const speed = params.particleSpeed * (0.7 + this.zDepth * 0.3)

      this.x += this.vx * speed + jitterX * speed
      this.y += this.vy * speed + jitterY * speed

      const dist = Math.hypot(this.x, this.y)
      const boundary = kannyRadius * 0.88

      if (dist >= boundary) {
        const nx = -this.x / dist
        const ny = -this.y / dist
        const dot = this.vx * nx + this.vy * ny

        this.vx = this.vx - 2 * dot * nx
        this.vy = this.vy - 2 * dot * ny

        this.x = (this.x / dist) * boundary * 0.98
        this.y = (this.y / dist) * boundary * 0.98

        this.vx += (Math.random() - 0.5) * 0.3
        this.vy += (Math.random() - 0.5) * 0.3
      }

      const currentSpeed = Math.hypot(this.vx, this.vy)
      if (currentSpeed > 0) {
        const targetSpeed = 1.5 + this.zDepth
        this.vx = (this.vx / currentSpeed) * targetSpeed
        this.vy = (this.vy / currentSpeed) * targetSpeed
      }

      this.alpha = this.baseAlpha * (0.6 + 0.4 * Math.abs(Math.sin(Date.now() * 0.02 * this.zDepth)))
      this.alpha = Math.max(0.3, Math.min(1, this.alpha))
    } else {
      const speedMult = params.particleSpeed * (0.5 + this.zDepth * 0.5)

      if (params.orbit > 0) {
        const distFromCenter = Math.hypot(this.x, this.y)
        if (distFromCenter > 0) {
          const nx = this.x / distFromCenter
          const ny = this.y / distFromCenter
          this.vx += -ny * params.orbit * 0.05
          this.vy += nx * params.orbit * 0.05
        }
      }

      this.vx *= 0.98
      this.vy *= 0.98

      this.vx += (Math.random() - 0.5) * 0.1
      this.vy += (Math.random() - 0.5) * 0.1

      const currentSpeed = Math.hypot(this.vx, this.vy)
      if (currentSpeed > 0 && currentSpeed < 0.5) {
        this.vx = (this.vx / currentSpeed) * 0.5
        this.vy = (this.vy / currentSpeed) * 0.5
      }

      this.x += (this.vx + jitterX) * speedMult
      this.y += (this.vy + jitterY) * speedMult

      const dist = Math.hypot(this.x, this.y)
      const boundary = kannyRadius * 0.9

      if (dist > boundary) {
        const nx = this.x / dist
        const ny = this.y / dist

        this.vx -= nx * 0.2 * speedMult
        this.vy -= ny * 0.2 * speedMult

        if (dist > kannyRadius * 1.1) {
          this.reset(kannyRadius)
        }
      }

      this.alpha = this.baseAlpha + params.chaos * 0.3 * Math.sin(Date.now() * 0.01 * this.zDepth)
      this.alpha = Math.max(0.1, Math.min(1, this.alpha))
    }

    if (params.waveMode > 0.001) {
      const waveInfluence = params.waveMode
      const blendPower = waveInfluence * waveInfluence

      const progress = waveTime + this.wavePhase

      const along = Math.sin(progress * 0.5) * kannyRadius * 0.75
      const perpAmt = Math.sin(progress * this.waveFreq + this.waveLane * Math.PI) * kannyRadius * 0.35
      const laneOffset = this.waveLane * kannyRadius * 0.6

      const dirX = Math.cos(this.waveDir)
      const dirY = Math.sin(this.waveDir)
      const perpX = -dirY
      const perpY = dirX

      const waveX = along * dirX + (perpAmt + laneOffset) * perpX
      const waveY = along * dirY + (perpAmt + laneOffset) * perpY

      this.x = this.x * (1 - blendPower) + waveX * blendPower
      this.y = this.y * (1 - blendPower) + waveY * blendPower

      if (waveInfluence > 0.5) {
        this.vx = (waveX - this.x) * 0.1
        this.vy = (waveY - this.y) * 0.1
      }

      const dist = Math.hypot(this.x, this.y)
      const waveBoundary = kannyRadius * 0.85
      if (dist > waveBoundary) {
        const overage = dist - waveBoundary
        this.x -= (this.x / dist) * overage * blendPower
        this.y -= (this.y / dist) * overage * blendPower
      }

      const targetWaveAlpha = this.baseAlpha * (0.7 + 0.3 * Math.sin(progress * 2))
      this.alpha = this.alpha * (1 - blendPower) + targetWaveAlpha * blendPower
      this.alpha = Math.max(0.1, Math.min(1, this.alpha))
    }
  }

  draw(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, sizeScale: number) {
    ctx.beginPath()
    ctx.arc(centerX + this.x, centerY + this.y, Math.max(0.4, this.radius * sizeScale), 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`
    ctx.shadowBlur = 8 * sizeScale
    ctx.shadowColor = 'rgba(0, 240, 255, 0.8)'
    ctx.fill()
    ctx.shadowBlur = 0
  }
}

class KannyParticleSystem {
  particles: KannyParticle[]
  time = 0
  waveTime = 0

  constructor(count: number, kannyRadius: number) {
    this.particles = []
    for (let i = 0; i < count; i++) {
      this.particles.push(new KannyParticle(kannyRadius))
    }
  }

  updateAndDraw(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    params: KannyStateParams,
    kannyRadius: number,
    detailScale: number,
  ) {
    this.time += 1
    this.waveTime += params.particleSpeed * 0.03

    for (const p of this.particles) {
      p.update(params, kannyRadius, this.waveTime, detailScale)
    }

    if (params.waveMode > 0) {
      ctx.lineWidth = Math.max(0.6, 1.5 * detailScale)
      const trailAlpha = 0.3 * params.waveMode

      const sorted = [...this.particles].sort((a, b) => a.waveDir - b.waveDir)

      for (let i = 0; i < sorted.length - 1; i++) {
        const p1 = sorted[i]
        const p2 = sorted[i + 1]

        const dirDiff = Math.abs(p1.waveDir - p2.waveDir)
        if (dirDiff < 0.3) {
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.hypot(dx, dy)

          if (dist < kannyRadius * 0.8 && dist > 5) {
            const alpha = trailAlpha * (1 - dist / (kannyRadius * 0.8))
            ctx.beginPath()
            ctx.moveTo(centerX + p1.x, centerY + p1.y)
            const midX = (p1.x + p2.x) / 2
            const midY = (p1.y + p2.y) / 2
            ctx.quadraticCurveTo(
              centerX + midX + Math.sin(this.time * 0.02 + i) * 5,
              centerY + midY + Math.cos(this.time * 0.02 + i) * 5,
              centerX + p2.x,
              centerY + p2.y,
            )
            ctx.strokeStyle = `rgba(0, 220, 240, ${alpha})`
            ctx.stroke()
          }
        }
      }
    }

    if (params.connectionThreshold > 0) {
      const threshold = params.connectionThreshold * detailScale
      ctx.lineWidth = Math.max(0.5, 1 * detailScale)

      for (let i = 0; i < this.particles.length; i++) {
        for (let j = i + 1; j < this.particles.length; j++) {
          const p1 = this.particles[i]
          const p2 = this.particles[j]

          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const distSq = dx * dx + dy * dy

          const threshSq = threshold * threshold

          if (distSq < threshSq) {
            const dist = Math.sqrt(distSq)
            const alpha = (1 - dist / threshold) * 0.6

            ctx.beginPath()
            ctx.moveTo(centerX + p1.x, centerY + p1.y)
            if (params.chaos > 0.5 && dist > threshold * 0.3) {
              const midX = (p1.x + p2.x) / 2 + (Math.random() - 0.5) * 20 * params.chaos * detailScale
              const midY = (p1.y + p2.y) / 2 + (Math.random() - 0.5) * 20 * params.chaos * detailScale
              ctx.lineTo(centerX + midX, centerY + midY)
            }

            ctx.lineTo(centerX + p2.x, centerY + p2.y)
            ctx.strokeStyle = `rgba(150, 240, 255, ${alpha})`
            ctx.stroke()
          }
        }
      }
    }

    for (const p of this.particles) {
      p.draw(ctx, centerX, centerY, detailScale)
    }
  }
}

/** Clamp helper. */
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function lerp(start: number, end: number, amt: number) {
  return (1 - amt) * start + amt * end
}

export interface KannyEngineOptions {
  /** Number of internal particles at the reference radius (scales with size). */
  particleCount?: number
}

/**
 * Drives a single Kanny orb rendered on a <canvas>. One instance per canvas;
 * call `resize` whenever the container size changes and `update`/`render`
 * once per animation frame.
 */
export class KannyEngine {
  private ctx: CanvasRenderingContext2D
  private particleSystem: KannyParticleSystem
  private baseParticleCount: number

  private logicalWidth = 0
  private logicalHeight = 0
  private baseRadius = REFERENCE_RADIUS

  private centerX = 0
  private centerY = 0
  private time = 0
  private wobblePhase = 0
  private eyeLookX = 0
  private eyeLookY = 0

  private currentStateName: KannyStateName = 'normal'
  private currentParams: KannyStateParams = { ...KANNY_STATES.normal }
  private targetParams: KannyStateParams = { ...KANNY_STATES.normal }
  private sleeping = false
  private sleepAmount = 0

  constructor(private canvas: HTMLCanvasElement, options: KannyEngineOptions = {}) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Kanny: no se pudo obtener el contexto 2D del canvas.')
    this.ctx = ctx
    this.baseParticleCount = options.particleCount ?? 42
    this.particleSystem = new KannyParticleSystem(this.baseParticleCount, this.baseRadius)
  }

  setState(stateName: KannyStateName) {
    if (this.currentStateName === stateName) return
    this.currentStateName = stateName
    this.targetParams = { ...KANNY_STATES[stateName] }
  }

  /** Toggles a "sleepy" eye look (closed, half-moon eyes) without changing the body state. */
  setSleeping(sleeping: boolean) {
    this.sleeping = sleeping
  }

  /** Update logical (CSS pixel) size. Should be called on mount and on resize. */
  resize(width: number, height: number) {
    this.logicalWidth = width
    this.logicalHeight = height
    this.baseRadius = (Math.min(width, height) / 2) * 0.68
  }

  private get scale() {
    return this.baseRadius / REFERENCE_RADIUS
  }

  update(pointerLocal: PointerLocal | null = null) {
    this.time += 1
    this.wobblePhase += this.currentParams.wobbleSpeed

    const easing = 0.05
    for (const key of Object.keys(this.targetParams) as Array<keyof KannyStateParams>) {
      this.currentParams[key] = lerp(this.currentParams[key], this.targetParams[key], easing)
      if (Math.abs(this.currentParams[key] - this.targetParams[key]) < 0.005) {
        this.currentParams[key] = this.targetParams[key]
      }
    }

    // Subtle cursor-follow for the pupils, blended with the idle wobble look.
    const eyeScaleFactor = Math.max(this.scale, 0.5)
    const maxLook = 4 * eyeScaleFactor
    let targetLookX = 0
    let targetLookY = 0
    if (pointerLocal) {
      const dist = Math.hypot(pointerLocal.x, pointerLocal.y)
      if (dist > 0) {
        const amount = Math.min(maxLook, dist / 50)
        targetLookX = (pointerLocal.x / dist) * amount
        targetLookY = (pointerLocal.y / dist) * amount
      }
    }
    this.eyeLookX = lerp(this.eyeLookX, targetLookX, 0.15)
    this.eyeLookY = lerp(this.eyeLookY, targetLookY, 0.15)

    this.sleepAmount = lerp(this.sleepAmount, this.sleeping ? 1 : 0, 0.08)
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.centerX = this.logicalWidth / 2
    this.centerY = this.logicalHeight / 2 + Math.sin(this.time * 0.03) * this.currentParams.floatAmp * Math.max(this.scale, 0.35)

    this.drawBody()

    const detailScale = clamp(this.scale, 0.35, 1.4)
    this.particleSystem.updateAndDraw(
      this.ctx,
      this.centerX,
      this.centerY,
      this.currentParams,
      this.baseRadius,
      detailScale,
    )

    this.drawEyes()
  }

  private drawBody() {
    const p = this.currentParams
    const ctx = this.ctx
    const scale = this.scale
    const wobbleScale = Math.max(scale, 0.35)

    ctx.save()
    ctx.translate(this.centerX, this.centerY)

    ctx.beginPath()
    const segments = 30
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2

      let currentRadius = this.baseRadius
      if (p.wobbleAmt > 0) {
        const wave1 = Math.sin(angle * 3 + this.wobblePhase)
        const wave2 = Math.cos(angle * 5 - this.wobblePhase * 1.5)
        const wave3 = Math.sin(angle * 2 + this.wobblePhase * 2)
        const totalWave = (wave1 + wave2 + wave3) / 3

        currentRadius += totalWave * p.wobbleAmt * wobbleScale
      }

      const x = Math.cos(angle) * currentRadius
      const y = Math.sin(angle) * currentRadius

      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()

    const grad = ctx.createRadialGradient(
      -this.baseRadius * 0.3,
      -this.baseRadius * 0.3,
      this.baseRadius * 0.1,
      0,
      0,
      this.baseRadius * 1.1,
    )

    const r = Math.round(p.colorR)
    const g = Math.round(p.colorG)
    const b = Math.round(p.colorB)

    grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
    grad.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.2)`)
    grad.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, 0.1)`)
    grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.4)`)

    ctx.fillStyle = grad

    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`
    ctx.shadowBlur = p.glow * Math.max(scale, 0.4)

    ctx.fill()

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = Math.max(0.75, 2 * scale)
    ctx.stroke()

    ctx.restore()
  }

  private drawEyes() {
    const p = this.currentParams
    const ctx = this.ctx
    const eyeScaleFactor = Math.max(this.scale, 0.5)

    ctx.save()
    ctx.translate(this.centerX, this.centerY)

    const wobbleLookX = Math.sin(this.time * 0.05) * p.wobbleAmt * 0.2 * Math.max(this.scale, 0.35)
    const wobbleLookY = Math.cos(this.time * 0.04) * p.wobbleAmt * 0.2 * Math.max(this.scale, 0.35)

    const lookX = wobbleLookX + this.eyeLookX
    const lookY = wobbleLookY + this.eyeLookY

    ctx.rotate(p.eyeTilt)

    const eyeSep = p.eyeSep * eyeScaleFactor
    const eyeRadius = 10 * p.eyeScale * eyeScaleFactor
    // Squash the eyes vertically as sleepAmount approaches 1 (closed, sleepy look).
    const openness = 1 - this.sleepAmount * 0.92

    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = '#ffffff'
    ctx.shadowBlur = 14 * eyeScaleFactor

    ctx.save()
    ctx.translate(-eyeSep + lookX, lookY)
    ctx.scale(1, Math.max(openness, 0.08))
    ctx.beginPath()
    ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.translate(eyeSep + lookX, lookY)
    ctx.scale(1, Math.max(openness, 0.08))
    ctx.beginPath()
    ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.restore()
  }
}
