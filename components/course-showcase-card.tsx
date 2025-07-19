"use client";

import { cn } from "@/lib/utils";

interface CourseShowcaseCardProps {
  title: string;
  category: string;
  duration: string;
  imageUrl: string;
  className?: string;
}

export function CourseShowcaseCard({
  title,
  category,
  duration,
  imageUrl,
  className,
}: CourseShowcaseCardProps) {
  return (
    <div
      className={cn(
        "relative h-[420px] w-[280px] cursor-pointer overflow-hidden rounded-2xl",
        "bg-gradient-to-t from-black/90 to-transparent",
        "group",
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
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="mb-3 text-2xl font-bold uppercase text-white font-heading leading-tight">
          {title}
        </h3>
        
        {/* Divider */}
        <div className="mb-4 h-0.5 w-16 bg-white/60" />
        
        <p className="mb-2 text-sm uppercase tracking-wide text-white/70">
          {category}
        </p>
        
        <p className="text-sm text-white/60">
          {duration}
        </p>
      </div>
    </div>
  );
}