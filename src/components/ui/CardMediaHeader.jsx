"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon } from "./Icon";
import { toMediaUrl } from "@/constants/app.constants";

export function CardMediaHeader({ logoSrc, title = "", companyName = "" }) {
  const logo = toMediaUrl(logoSrc);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const nameToUse = companyName || title || "Vessel";
  const initials = nameToUse
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const hasImage = Boolean(logo) && !error;

  return (
    <div className="relative flex aspect-[18/9] max-h-36 sm:max-h-40 w-full items-center justify-center overflow-hidden border-b border-line-soft bg-gradient-to-br from-[#0B1E36] via-[#056DEC]/85 to-[#0B1E36] text-white">
      {/* Fallback Ship Silhouette Watermark */}
      {!hasImage ? (
        <svg
          className="absolute -right-2 -bottom-3 h-24 w-28 text-white/10 pointer-events-none select-none"
          fill="currentColor"
          viewBox="0 0 640 512"
          aria-hidden="true"
        >
          <path d="M272 0c-26.5 0-48 21.5-48 48l0 16-16 0c-44.2 0-80 35.8-80 80l0 108.8-21.6 8.6c-14.8 5.9-22.5 22.4-17.4 37.5 10.4 31.3 26.8 59.3 47.7 83.1 20.1-9.2 41.7-13.9 63.3-14 33.1-.2 66.3 10.2 94.4 31.4l1.6 1.2 0-215-104 41.6 0-83.2c0-8.8 7.2-16 16-16l224 0c8.8 0 16 7.2 16 16l0 83.2-104-41.6 0 215 1.6-1.2c27.5-20.7 59.9-31.2 92.4-31.4 22.3-.1 44.6 4.5 65.3 14 20.9-23.7 37.3-51.8 47.7-83.1 5-15.2-2.6-31.6-17.4-37.5L512 252.8 512 144c0-44.2-35.8-80-80-80l-16 0 0-16c0-26.5-21.5-48-48-48L272 0z" />
        </svg>
      ) : null}

      {/* Loading Skeleton */}
      {hasImage && !loaded ? (
        <div className="absolute inset-0 bg-primary-tint/50 animate-pulse z-10" />
      ) : null}

      {/* Ambient Blurred Background (to fill side/top spaces harmoniously without cropping) */}
      {hasImage && loaded ? (
        <Image
          src={logo}
          alt=""
          fill
          aria-hidden="true"
          className="object-cover size-full blur-xl scale-125 opacity-35 pointer-events-none select-none"
        />
      ) : null}

      {/* Uncropped Main Foreground Image */}
      {hasImage ? (
        <Image
          src={logo}
          alt={companyName || title || "Vessel Image"}
          fill
          sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`relative z-10 size-full object-contain p-2 transition-opacity duration-300 drop-shadow-xs ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      ) : (
        <div className="relative z-10 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-xs">
          <span className="flex size-6 items-center justify-center rounded-full bg-white/20 text-xs font-black text-white">
            <Icon name="ship" size={12} />
          </span>
          <span className="text-xs font-extrabold tracking-wider uppercase text-white drop-shadow-xs">
            {initials || "CR"}
          </span>
        </div>
      )}
    </div>
  );
}

export default CardMediaHeader;
