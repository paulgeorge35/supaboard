import { useEffect, useState } from 'react'

type ConfettiProps = {
    onComplete?: () => void
    duration?: number
    /** Delay before starting the animation */
    startDelay?: number
}

const COLORS = ['#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF']
const PARTICLE_COUNT = 50

// Create irregular four-sided polygon shapes
const createPolygonPath = () => {
    // Generate random points with some constraints to ensure interesting but not too wild shapes
    const x1 = Math.random() * 20 + 10
    const y1 = Math.random() * 20 + 10
    const x2 = Math.random() * 20 + 30
    const y2 = Math.random() * 20 + 10
    const x3 = Math.random() * 20 + 30
    const y3 = Math.random() * 20 + 30
    const x4 = Math.random() * 20 + 10
    const y4 = Math.random() * 20 + 30
    
    return `polygon(${x1}% ${y1}%, ${x2}% ${y2}%, ${x3}% ${y3}%, ${x4}% ${y4}%)`
}

const createParticle = (id: number, duration: number) => ({
    id,
    style: {
        '--x': `${(Math.random() - 0.5) * 300}px`,
        '--y': `${(Math.random() * -200) - 100}px`,
        '--r': `${Math.random() * 1080 - 540}deg`,
        '--delay': `${Math.random() * 150}ms`,
        '--duration': `${duration}ms`,
        '--size': `${Math.random() * 15 + 5}px`,
        '--shape': createPolygonPath(),
        backgroundColor: COLORS[Math.floor(Math.random() * COLORS.length)]
    } as React.CSSProperties
})

export const Confetti = ({ onComplete, duration = 1500, startDelay = 100 }: ConfettiProps) => {
    const [shouldShow, setShouldShow] = useState(false)
    const [particles, setParticles] = useState<ReturnType<typeof createParticle>[]>([])

    useEffect(() => {
        // Start delay
        const startTimer = setTimeout(() => {
            setShouldShow(true)
            setParticles(Array.from({ length: PARTICLE_COUNT }, (_, i) => createParticle(i, duration)))
        }, startDelay)

        return () => clearTimeout(startTimer)
    }, [duration, startDelay])

    useEffect(() => {
        if (!shouldShow) return

        // Cleanup timer
        const cleanupTimer = setTimeout(() => {
            setParticles([])
            setShouldShow(false)
            onComplete?.()
        }, duration + 150)

        return () => clearTimeout(cleanupTimer)
    }, [shouldShow, duration, onComplete])

    if (!shouldShow || particles.length === 0) return null

    return (
        <div className="confetti-container">
            {particles.map(particle => (
                <div
                    key={particle.id}
                    className="confetti-particle"
                    style={particle.style}
                />
            ))}
        </div>
    )
} 