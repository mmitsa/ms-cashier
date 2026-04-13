"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Banner } from "@/lib/types";

export function HeroBanner({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (banners.length === 0) {
    return (
      <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] bg-gradient-to-bl from-primary-600 to-primary-900 flex items-center justify-center rounded-2xl mx-4 sm:mx-6 lg:mx-8 mt-4">
        <div className="text-center text-white px-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            مرحباً بك في متجرنا
          </h1>
          <p className="text-lg sm:text-xl opacity-90">
            اكتشف أفضل المنتجات بأسعار مميزة
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] rounded-2xl mx-4 sm:mx-6 lg:mx-8 mt-4 overflow-hidden">
      {banners.map((banner, idx) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === current ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Image
            src={banner.image}
            alt={banner.title || "بانر"}
            fill
            className="object-cover"
            sizes="100vw"
            priority={idx === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {(banner.title || banner.subtitle) && (
            <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 lg:p-12 text-white">
              {banner.title && (
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                  {banner.title}
                </h2>
              )}
              {banner.subtitle && (
                <p className="text-sm sm:text-base opacity-90 max-w-lg">
                  {banner.subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute end-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            aria-label="السابق"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute start-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            aria-label="التالي"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === current
                    ? "w-6 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`بانر ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
