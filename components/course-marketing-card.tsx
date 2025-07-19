"use client";

import { cn } from "@/lib/utils";

interface CourseMarketingCardProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  runtime?: string;
  isNew?: boolean;
  className?: string;
}

export function CourseMarketingCard({
  title,
  subtitle,
  imageUrl,
  runtime,
  isNew = false,
  className,
}: CourseMarketingCardProps) {
  return (
    <div
      className={cn(
        "relative h-[240px] w-[160px] cursor-pointer overflow-hidden rounded-2xl",
        "bg-gradient-to-t from-black/90 to-transparent",
        "transform transition-all duration-300 hover:scale-105",
        className
      )}
    >
      {/* Background Image */}
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover"
      />
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      
      {/* New Badge */}
      {isNew && (
        <div className="absolute top-4 left-4 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1">
          <span className="text-xs font-semibold text-white">NEW</span>
        </div>
      )}
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="mb-2 text-sm font-bold uppercase text-white font-heading leading-tight">
          {title}
        </h3>
        
        {/* Divider */}
        <div className="mb-2 h-0.5 w-8 bg-white/50" />
        
        <p className="mb-2 text-xs text-white/80">{subtitle}</p>
        
        {/* Runtime */}
        {runtime && (
          <p className="text-xs text-white/60">{runtime}</p>
        )}
      </div>
    </div>
  );
}