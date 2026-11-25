import Image from "next/image"

interface OnControlLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function OnControlLogo({ className = "", size = "md" }: OnControlLogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  }
  
  const imageSizes = {
    sm: 36,
    md: 48,
    lg: 64,
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Image
          src="/favicon.ico"
          alt="Logo"
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="object-contain"
          unoptimized
        />
      </div>
      <span className={`font-bold ${sizeClasses[size]}`}>
        <span className="text-accent">ONCO</span>
        <span className="text-primary">NTROL</span>
      </span>
    </div>
  )
}
