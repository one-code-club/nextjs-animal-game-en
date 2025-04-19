"use client"

import { useEffect, useState } from "react"
import ReactConfetti from "react-confetti"

export function Confetti() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const { innerWidth: width, innerHeight: height } = window
    setDimensions({ width, height })

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <ReactConfetti
      width={dimensions.width}
      height={dimensions.height}
      recycle={false}
      numberOfPieces={800}
      gravity={0.2}
      colors={["#f472b6", "#a855f7", "#60a5fa", "#4ade80", "#facc15"]}
      confettiSource={{
        x: dimensions.width / 2,
        y: dimensions.height / 3,
        w: 0,
        h: 0,
      }}
    />
  )
}
