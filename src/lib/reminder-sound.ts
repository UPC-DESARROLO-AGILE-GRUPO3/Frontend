import type { ReminderTone } from "@/lib/api"

let audioContext: AudioContext | undefined

export async function playReminderTone(tone: ReminderTone) {
  if (tone === "SILENT") return
  if (typeof AudioContext !== "function") throw new Error("Este navegador no puede reproducir el sonido")

  const context = audioContext ??= new AudioContext()
  if (context.state !== "running") await context.resume()

  const frequencies = tone === "SOFT" ? [440] : [660, 880]
  frequencies.forEach((frequency, index) => {
    const startsAt = context.currentTime + index * 0.18
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.001, startsAt)
    gain.gain.linearRampToValueAtTime(0.13, startsAt + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, startsAt + 0.22)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(startsAt)
    oscillator.stop(startsAt + 0.23)
    oscillator.onended = () => {
      oscillator.disconnect()
      gain.disconnect()
    }
  })
}
