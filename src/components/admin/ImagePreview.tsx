'use client'

interface ImagePreviewProps {
  src: string
  alt: string
  className?: string
  containerClassName?: string
  showFallbackContainer?: boolean
  fallbackHeight?: string
}

export default function ImagePreview({ 
  src, 
  alt, 
  className = "", 
  containerClassName = "",
  showFallbackContainer = true,
  fallbackHeight = "h-48"
}: ImagePreviewProps) {
  const defaultContainer = showFallbackContainer 
    ? "bg-white rounded-lg border border-gray-200 p-4" 
    : "";
  
  const finalContainerClass = containerClassName || defaultContainer;

  return (
    <div className={finalContainerClass}>
      <img 
        src={src} 
        alt={alt}
        className={showFallbackContainer 
          ? `w-full ${fallbackHeight} object-cover rounded-lg ${className}`
          : className
        }
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) {
            fallback.classList.remove('hidden');
          }
        }}
      />
      <div className={`hidden ${fallbackHeight} bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center`}>
        <svg className="w-12 h-12 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
  )
}