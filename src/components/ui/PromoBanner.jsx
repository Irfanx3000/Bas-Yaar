"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { bannerService } from "@/services/banner.service";

/* Admin-managed promo banners, mirroring the app's PromoBannerCarousel.
 *
 * Behaviour taken from the app:
 *   · fetched from the public GET /banners — payload is { id, imageUrl, linkUrl }
 *   · a fetch FAILURE IS SILENT. The app comments "Silent — the default slide
 *     below covers this", and that is right: a promo strip is not worth an error
 *     message on a screen the user came to for their applications.
 *   · autoplay only when there is more than one slide
 *   · a slide with no linkUrl is not clickable — the admin decides that per
 *     banner, so a banner without a link must not pretend to be a button
 *
 * Deliberately different from the app: it measures each remote image to get its
 * true aspect ratio, because React Native cannot size a remote image otherwise.
 * The browser does that natively, so the round trip and the `aspectRatios` state
 * it needs are dropped — `next/image` with a fixed ratio and `object-cover`
 * gives the same result with none of the machinery.
 *
 * The images are served from api.crewapply.com, which is already declared in
 * next.config.mjs remotePatterns.
 *
 * ponytail: no swipe gestures. Autoplay plus dots covers a strip that is
 * usually one image; add drag when there is a real carousel to drag.
 */

const AUTOPLAY_MS = 5000;

export function PromoBanner({ className = "" }) {
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    bannerService
      .getBanners()
      .then((list) => {
        if (!cancelled) setBanners(list || []);
      })
      .catch(() => {
        /* Silent, as in the app — the component simply renders nothing. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [banners.length]);

  /* The app falls back to a bundled default slide. The web has no such asset,
     and an empty strip is better than a broken image — so render nothing. */
  if (banners.length === 0) return null;

  const active = banners[index] ?? banners[0];

  const slide = (
    <div className="relative aspect-[16/6] w-full overflow-hidden rounded-lg bg-primary-light">
      <Image
        src={active.imageUrl}
        alt=""
        fill
        sizes="(min-width: 1024px) 44rem, 100vw"
        className="object-cover"
      />
    </div>
  );

  return (
    <div className={className}>
      {active.linkUrl ? (
        <a
          href={active.linkUrl}
          target="_blank"
          /* External and admin-supplied, so noopener/noreferrer is not optional:
             the destination is whatever an admin typed into the panel. */
          rel="noopener noreferrer"
          className="press block"
        >
          {slide}
        </a>
      ) : (
        slide
      )}

      {banners.length > 1 ? (
        <div className="mt-2 flex justify-center gap-[5px]">
          {banners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show banner ${i + 1} of ${banners.length}`}
              aria-current={i === index}
              className={`h-1.5 cursor-pointer rounded-round transition-all duration-[280ms] ease-decelerate ${
                i === index ? "w-5 bg-primary" : "w-1.5 bg-line"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default PromoBanner;
