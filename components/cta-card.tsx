"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

interface CTACardProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  month?: string;
  className?: string;
}

export function CTACard({
  title,
  subtitle,
  imageUrl,
  href,
  month,
  className,
}: CTACardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "relative block h-[280px] w-full overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-secondary/80 to-secondary/40",
        "transform transition-all duration-300 hover:scale-[1.02]",
        "shadow-xl hover:shadow-2xl",
        className
      )}
    >
      {/* Background Image with Dark Filter */}
      <div className="absolute inset-0">
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      
      {/* Month Badge */}
      {month && (
        <div className="absolute top-4 left-4 rounded-lg bg-white/10 backdrop-blur-md px-3 py-1.5 border border-white/20">
          <span className="text-xs font-semibold text-white">{month}</span>
        </div>
      )}
      
      {/* Content */}
      <div className="relative flex h-full flex-col items-center justify-center p-8 text-center">
        <h3 className="mb-4 text-3xl font-bold uppercase text-white font-heading leading-tight">
          {title}
        </h3>
        
        {/* Divider */}
        <div className="mb-4 h-0.5 w-16 bg-white/50" />
        
        <p className="text-sm text-white/80 font-medium">{subtitle}</p>
      </div>
    </Link>
  );
}