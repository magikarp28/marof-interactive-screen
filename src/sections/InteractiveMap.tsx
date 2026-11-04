import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  normalizeNumberArray,
  type Location,
  type WordPressMedia,
} from "../api/wordpress";
import { useLocations, useWordPressMedia } from "../hooks/useCmsData";
import mapImage from "../assets/images/Map image.jpg";
import SectionLayout from "./SectionLayout";
import { FaParking } from "react-icons/fa";

type InteractiveMapProps = {
  onBack: () => void;
};

// Temporary positions as percentages of the original map image.
const parkingPositions = [
  { x: 23, y: 62 },
  { x: 6, y: 20 },
  { x: 10, y: 91 },
];
const youAreHerePosition = { x: 45.5, y: 79 };
const maxZoom = 3;
const mapAspectRatio = 2000 / 1213;
const mobileMapQuery = "(max-width: 767px), (max-height: 500px)";

function clampZoom(zoom: number, minZoom: number) {
  return Math.min(maxZoom, Math.max(minZoom, zoom));
}

function localizedLocationTitle(location: Location, language: "hr" | "en") {
  if (language === "en") {
    return location.meta.title_en || location.title.rendered;
  }

  return location.title.rendered;
}

function localizedMapLabel(location: Location, language: "hr" | "en") {
  return (
    location.meta[`map_label_${language}`]?.trim() ||
    location.meta.map_label_hr?.trim() ||
    localizedLocationTitle(location, language)
  );
}

function localizedText(
  location: Location,
  field: "short_description" | "description",
  language: "hr" | "en",
) {
  const localized = location.meta[`${field}_${language}`];
  return localized || location.meta[`${field}_hr`];
}

function orderedMedia(ids: number[], media: WordPressMedia[]) {
  const mediaById = new Map(media.map((item) => [item.id, item]));
  return ids.flatMap((id) => {
    const item = mediaById.get(id);
    return item ? [item] : [];
  });
}

function InteractiveMap({ onBack }: InteractiveMapProps) {
  const { t, i18n } = useTranslation();
  const { data: locations, isLoading, error } = useLocations();
  const mediaIds = locations.flatMap((location) => [
    ...normalizeNumberArray(location.meta.gallery_image_ids),
    ...normalizeNumberArray(location.meta.video_ids),
  ]);
  const { data: media, isLoading: isMediaLoading } =
    useWordPressMedia(mediaIds);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null,
  );
  const [zoom, setZoom] = useState(1);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(mobileMapQuery).matches,
  );
  const [mobileMapSize, setMobileMapSize] = useState({
    baseWidth: 0,
    minZoom: 1,
  });
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const selectedMarkerRef = useRef<HTMLButtonElement>(null);
  const centeredMobileMapRef = useRef(false);
  const minZoom = isMobile ? mobileMapSize.minZoom : 1;
  const minZoomRef = useRef(minZoom);
  minZoomRef.current = minZoom;
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const language = i18n.resolvedLanguage === "en" ? "en" : "hr";
  const selectedLocation = locations.find(
    (location) => location.id === selectedLocationId,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobileMapQuery);
    const handleChange = (event: MediaQueryListEvent) =>
      setIsMobile(event.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const viewport = mapViewportRef.current;
    if (!isMobile || !viewport) {
      centeredMobileMapRef.current = false;
      setZoom((current) => clampZoom(current, 1));
      return;
    }

    const observer = new ResizeObserver(() => {
      const { width, height } = viewport.getBoundingClientRect();
      if (!width || !height) return;
      const baseWidth = Math.max(width, height * mapAspectRatio);
      const fitZoom = Math.min(1, (width - 1) / baseWidth);
      setMobileMapSize((current) =>
        current.baseWidth === baseWidth && current.minZoom === fitZoom
          ? current
          : { baseWidth, minZoom: fitZoom },
      );
      setZoom((current) => clampZoom(current, fitZoom));
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [isMobile]);

  useEffect(() => {
    const viewport = mapViewportRef.current;
    if (
      !isMobile ||
      !mobileMapSize.baseWidth ||
      !viewport ||
      centeredMobileMapRef.current
    ) {
      return;
    }
    viewport.scrollLeft =
      (mobileMapSize.baseWidth * youAreHerePosition.x) / 100 -
      viewport.clientWidth / 2;
    centeredMobileMapRef.current = true;
  }, [isMobile, mobileMapSize.baseWidth]);

  useEffect(() => {
    if (isMobile && selectedLocation) {
      closeButtonRef.current?.focus();
    }
  }, [isMobile, selectedLocationId, selectedLocation]);

  const closeDetails = () => {
    setSelectedLocationId(null);
    requestAnimationFrame(() => selectedMarkerRef.current?.focus());
  };

  const handleDetailKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!isMobile || !selectedLocation) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeDetails();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = detailRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  useEffect(() => {
    if (
      selectedLocationId !== null &&
      !locations.some((location) => location.id === selectedLocationId)
    ) {
      setSelectedLocationId(null);
    }
  }, [locations, selectedLocationId]);

  useEffect(() => {
    const viewport = mapViewportRef.current;
    if (!viewport) return;

    let pinch: { distance: number; zoom: number } | null = null;
    const distance = (touches: TouchList) =>
      Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY,
      );
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        pinch = { distance: distance(event.touches), zoom: zoomRef.current };
      }
    };
    const handleTouchMove = (event: TouchEvent) => {
      if (pinch && event.touches.length === 2 && pinch.distance > 0) {
        event.preventDefault();
        setZoom(
          clampZoom(
            pinch.zoom * (distance(event.touches) / pinch.distance),
            minZoomRef.current,
          ),
        );
      }
    };
    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) pinch = null;
    };

    viewport.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    viewport.addEventListener("touchmove", handleTouchMove, { passive: false });
    viewport.addEventListener("touchend", handleTouchEnd);
    viewport.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      viewport.removeEventListener("touchstart", handleTouchStart);
      viewport.removeEventListener("touchmove", handleTouchMove);
      viewport.removeEventListener("touchend", handleTouchEnd);
      viewport.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  const images = selectedLocation
    ? orderedMedia(
        normalizeNumberArray(selectedLocation.meta.gallery_image_ids),
        media,
      )
    : [];
  const videos = selectedLocation
    ? orderedMedia(normalizeNumberArray(selectedLocation.meta.video_ids), media)
    : [];
  return (
    <SectionLayout title={t("sections.map")} onBack={onBack} compactOnMobile>
      <div className="interactive-map-layout grid w-full self-stretch gap-4 portrait:content-start landscape:lg:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.85fr)] landscape:lg:items-start">
        <div className="interactive-map-frame min-h-0 overflow-hidden border-2 border-[#426795] bg-[#ffffff] shadow-[8px_8px_0_rgba(66,103,149,0.18)]">
          <div className="interactive-map-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-[#426795]/30 px-3 py-2 sm:px-4">
            <p className="interactive-map-instructions text-sm font-semibold text-black/70">
              {t("interactiveMap.mapInstructions")}
            </p>
            <div
              className="flex items-center gap-2"
              role="group"
              aria-label={t("interactiveMap.zoom")}
            >
              <button
                type="button"
                aria-label={t("interactiveMap.zoomOut")}
                disabled={zoom <= minZoom + 0.001}
                onClick={() =>
                  setZoom((current) => clampZoom(current - 0.25, minZoom))
                }
                className="h-10 w-10 rounded border-2 border-[#426795] text-2xl font-bold text-[#426795] disabled:opacity-40"
              >
                −
              </button>
              <span
                className="min-w-12 text-center text-sm font-bold"
                aria-live="polite"
              >
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                aria-label={t("interactiveMap.zoomIn")}
                disabled={zoom >= maxZoom}
                onClick={() =>
                  setZoom((current) => clampZoom(current + 0.25, minZoom))
                }
                className="h-10 w-10 rounded border-2 border-[#426795] text-2xl font-bold text-[#426795] disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
          <div className="interactive-map-status">
            {isLoading ? (
              <p className="p-6 text-xl font-semibold">
                {t("interactiveMap.loading")}
              </p>
            ) : null}

            {error ? (
              <p
                className="m-5 border-2 border-[#ad3427] bg-[#ffffff] px-5 py-4 text-xl font-semibold text-[#7b2119]"
                role="alert"
              >
                {t("interactiveMap.error")}
              </p>
            ) : null}

            {!isLoading && !error && locations.length === 0 ? (
              <p className="p-6 text-xl font-semibold">
                {t("interactiveMap.empty")}
              </p>
            ) : null}
          </div>

          <div
            ref={mapViewportRef}
            className="interactive-map-viewport max-h-[55dvh] overflow-auto overscroll-contain [touch-action:pan-x_pan-y] portrait:lg:max-h-[65dvh]"
            role="region"
            aria-label={t("interactiveMap.mapAlt")}
            tabIndex={0}
          >
            <div
              className="interactive-map-canvas relative"
              style={
                {
                  "--map-zoom": `${zoom * 100}%`,
                  "--map-min-width": `${zoom * 720}px`,
                  "--map-scale": zoom,
                  "--mobile-map-base-width": `${mobileMapSize.baseWidth}px`,
                } as CSSProperties
              }
            >
              <img
                className="block h-auto w-full"
                src={mapImage}
                alt={t("interactiveMap.mapAlt")}
                draggable={false}
              />
              {parkingPositions.map((position, index) => (
                <span
                  key={index}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded bg-white p-1 text-[#1463b3] shadow"
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                  role="img"
                  aria-label={t("interactiveMap.parking")}
                >
                  <FaParking
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    aria-hidden="true"
                  />
                </span>
              ))}
              <div
                className="absolute z-10 flex flex-col -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full  px-3 py-2 text-xs font-black text-[#922b1e] sm:text-xs"
                style={{
                  left: `${youAreHerePosition.x}%`,
                  top: `${youAreHerePosition.y}%`,
                }}
              >
                <span
                  className="relative flex h-3 w-3 shrink-0 "
                  aria-hidden="true"
                >
                  <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D96543] opacity-75 motion-reduce:animate-none" />
                  <div className="relative inline-flex h-3 w-3 rounded-full bg-[#b52e1b]" />
                </span>
                <div>{t("interactiveMap.youAreHere")}</div>
              </div>
              {locations.map((location, index) => {
                const isSelected = location.id === selectedLocationId;
                const label = localizedMapLabel(location, language);

                return (
                  <motion.button
                    key={location.id}
                    type="button"
                    className={`absolute grid min-h-8 min-w-8 max-w-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg border-2 px-1.5 py-0.5 text-center text-xs  leading-tight wrap-anywhere backdrop-blur-[2px] outline-offset-4 transition-colors focus-visible:outline-4 focus-visible:outline-black sm:min-h-10 sm:min-w-10 sm:max-w-40 sm:text-sm ${
                      isSelected
                        ? "border-[#426795] bg-[#D96543] text-black shadow-[0_3px_0_rgba(0,0,0,0.45)]"
                        : "border-[#F4EFE5]/90 bg-[#426795]/60 text-[#F4EFE5] shadow-[0_2px_0_rgba(0,0,0,0.3)] [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] hover:bg-[#D96543]"
                    }`}
                    style={{
                      left: `${location.map_x}%`,
                      top: `${location.map_y}%`,
                    }}
                    aria-label={t("interactiveMap.openLocation", {
                      title: label,
                    })}
                    aria-pressed={isSelected}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 340,
                      damping: 22,
                    }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={(event) => {
                      selectedMarkerRef.current = event.currentTarget;
                      setSelectedLocationId(location.id);
                    }}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        <aside
          ref={detailRef}
          className={`interactive-map-detail min-h-60 overflow-y-auto border-2 border-black/30 bg-[#ffffff] p-5 shadow-[6px_6px_0_rgba(66,103,149,0.12)] lg:p-6 landscape:lg:max-h-full ${selectedLocation ? "is-open" : ""}`}
          role={isMobile && selectedLocation ? "dialog" : undefined}
          aria-modal={isMobile && selectedLocation ? true : undefined}
          aria-label={
            isMobile && selectedLocation
              ? localizedLocationTitle(selectedLocation, language)
              : undefined
          }
          aria-live={isMobile ? undefined : "polite"}
          onKeyDown={handleDetailKeyDown}
        >
          {isMobile && selectedLocation ? (
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeDetails}
              className="sticky top-0 z-10 mb-5 rounded border-2 border-[#426795] bg-white px-4 py-2 font-bold text-[#426795] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#D96543]"
            >
              {t("interactiveMap.closeDetails")}
            </button>
          ) : null}
          <AnimatePresence mode="wait">
            {selectedLocation ? (
              <motion.article
                key={selectedLocation.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
              >
                <p className="text-sm font-bold tracking-[0.14em] text-[#D96543] uppercase">
                  {t("interactiveMap.locationLabel")}
                </p>
                <h2 className="mt-2 text-3xl font-bold leading-tight">
                  {localizedLocationTitle(selectedLocation, language)}
                </h2>

                {localizedText(
                  selectedLocation,
                  "short_description",
                  language,
                ) ? (
                  <p className="mt-4 text-lg font-semibold leading-relaxed text-black/65">
                    {localizedText(
                      selectedLocation,
                      "short_description",
                      language,
                    )}
                  </p>
                ) : null}

                {localizedText(selectedLocation, "description", language) ? (
                  <div
                    className="mt-5 border-t-2 border-[#D96543]/55 pt-5 leading-relaxed [&_a]:font-bold [&_a]:text-[#426795] [&_p]:mb-3"
                    dangerouslySetInnerHTML={{
                      __html: localizedText(
                        selectedLocation,
                        "description",
                        language,
                      ),
                    }}
                  />
                ) : null}

                {images.length > 0 ? (
                  <section className="mt-6 border-t-2 border-[#D96543]/55 pt-5">
                    <h3 className="text-lg font-bold">
                      {t("interactiveMap.images")}
                    </h3>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {images.map((image) => (
                        <img
                          key={image.id}
                          className="aspect-square w-full border border-black/25 object-cover"
                          src={image.source_url}
                          alt={image.alt_text || image.caption.rendered || ""}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                {videos.length > 0 ? (
                  <section className="mt-6 border-t-2 border-[#D96543]/55 pt-5">
                    <h3 className="text-lg font-bold">
                      {t("interactiveMap.videos")}
                    </h3>
                    <div className="mt-3 space-y-3">
                      {videos.map((video) => (
                        <video
                          key={video.id}
                          className="aspect-video w-full border border-black/25 bg-black"
                          controls
                          preload="metadata"
                          src={video.source_url}
                        >
                          {t("interactiveMap.videoUnsupported")}
                        </video>
                      ))}
                    </div>
                  </section>
                ) : null}

                {isMediaLoading ? (
                  <p className="mt-5 text-sm font-semibold text-black/65">
                    {t("interactiveMap.loadingMedia")}
                  </p>
                ) : null}
              </motion.article>
            ) : (
              <motion.p
                key="empty-detail"
                className="flex min-h-48 items-center text-xl font-semibold leading-relaxed text-black/65"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {t("interactiveMap.selectPrompt")}
              </motion.p>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </SectionLayout>
  );
}

export default InteractiveMap;
