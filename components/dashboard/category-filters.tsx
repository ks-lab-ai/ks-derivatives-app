"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CategoryFiltersProps {
  onCategoryChange?: (category: string) => void;
}

const categories = [
  "Trending",
  "Options & Dérivés",
  "Trading & Analyse",
  "Gestion des Risques",
  "Stratégies Avancées",
  "Marchés Financiers",
  "Crypto & DeFi",
  "Analyse Technique",
  "Psychologie du Trading",
  "Automatisation",
  "Fiscalité & Règlementation",
  "Portfolio Management",
  "Actualités & Tendances",
];

export function CategoryFilters({ onCategoryChange }: CategoryFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState("Trending");

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    onCategoryChange?.(category);
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-4">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => handleCategoryClick(category)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
            "border border-white/10 backdrop-blur-sm",
            selectedCategory === category
              ? "bg-white text-black"
              : "bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}