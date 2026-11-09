import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { VisitorRoute, WordPressMedia } from "../api/wordpress";
import { useVisitorRoutes, useWordPressMedia } from "../hooks/useCmsData";
import SectionLayout from "./SectionLayout";

const PAGE_SIZE = 10;

type VisitorRoutesProps = {
  onBack: () => void;
  routeId: number | null;
  onRouteSelect: (id: number | null) => void;
};

function localizedRouteTitle(route: VisitorRoute, language: "hr" | "en") {
  if (language === "en") {
    return route.meta.title_en || route.title.rendered;
  }

  return route.title.rendered;
}

function localizedRouteText(route: VisitorRoute, language: "hr" | "en") {
  return route.meta[`text_${language}`] || route.meta.text_hr;
}

function parseRouteDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatRouteDates(route: VisitorRoute, formatter: Intl.DateTimeFormat) {
  const from = parseRouteDate(route.meta.date_from);
  const to = parseRouteDate(route.meta.date_to);

  if (from && to) {
    return `${formatter.format(from)} – ${formatter.format(to)}`;
  }

  const single = from ?? to;
  return single ? formatter.format(single) : "";
}

function mediaThumbnail(item: WordPressMedia) {
  const sizes = item.media_details?.sizes;
  return (
    sizes?.thumbnail?.source_url ?? sizes?.medium?.source_url ?? item.source_url
  );
}

function VisitorRoutes({ onBack, routeId, onRouteSelect }: VisitorRoutesProps) {
  const { t, i18n } = useTranslation();
  const { data: routes, isLoading, error } = useVisitorRoutes();
  const language = i18n.resolvedLanguage === "en" ? "en" : "hr";
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(routes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRoutes = routes.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );
  const selectedRoute = routes.find((route) => route.id === routeId);
  const mediaIds = (
    selectedRoute
      ? [selectedRoute.featured_media, selectedRoute.qr_code]
      : pageRoutes.map((route) => route.featured_media)
  ).filter((id) => id > 0);
  const { data: media } = useWordPressMedia(mediaIds);
  const featuredImage = media.find(
    (item) => item.id === selectedRoute?.featured_media,
  );
  const qrCode = media.find((item) => item.id === selectedRoute?.qr_code);
  const detailRef = useRef<HTMLElement>(null);
  const dateFormatter = new Intl.DateTimeFormat(
    language === "en" ? "en-GB" : "hr-HR",
    { day: "numeric", month: "long", year: "numeric" },
  );

  useEffect(() => {
    if (
      routeId !== null &&
      !isLoading &&
      !error &&
      !routes.some((route) => route.id === routeId)
    ) {
      onRouteSelect(null);
    }
  }, [routes, isLoading, error, routeId, onRouteSelect]);

  useEffect(() => {
    if (
      routeId !== null &&
      window.matchMedia("(orientation: portrait)").matches
    ) {
      detailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [routeId]);

  const eventTypeLabel = (route: VisitorRoute) =>
    route.meta.event_type
      ? t(`visitorRoutes.eventTypes.${route.meta.event_type}`)
      : "";

  return (
    <SectionLayout title={t("sections.routes")} onBack={onBack}>
      {routeId === null ? (
        <div className="w-full max-w-400 self-stretch border-2 border-[#426795] bg-[#ffffff] shadow-[8px_8px_0_rgba(66,103,149,0.18)]">
          <div className="border-b-2 border-[#D96543]/55 px-5 py-4 lg:px-6">
            <h2 className="text-2xl font-bold">
              {t("visitorRoutes.listTitle")}
            </h2>
          </div>

          {isLoading ? (
            <p className="p-5 text-lg font-semibold">
              {t("visitorRoutes.loading")}
            </p>
          ) : null}

          {error ? (
            <p
              className="m-5 border-2 border-[#ad3427] bg-[#ffffff] px-4 py-3 font-semibold text-[#7b2119]"
              role="alert"
            >
              {t("visitorRoutes.error")}
            </p>
          ) : null}

          {!isLoading && !error && routes.length === 0 ? (
            <p className="p-5 text-lg font-semibold">
              {t("visitorRoutes.empty")}
            </p>
          ) : null}

          <ol className="divide-y-2 divide-[#D96543]/35">
            {pageRoutes.map((route) => {
              const title = localizedRouteTitle(route, language);
              const dateText = formatRouteDates(route, dateFormatter);
              const eventType = eventTypeLabel(route);
              const thumbnail = media.find(
                (item) => item.id === route.featured_media,
              );

              return (
                <li key={route.id}>
                  <button
                    type="button"
                    onClick={() => onRouteSelect(route.id)}
                    className="flex w-full items-center gap-5 px-5 py-4 text-left transition-colors hover:bg-[#D8BF9E] focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-[#D96543] lg:px-6"
                  >
                    {thumbnail ? (
                      <img
                        className="size-20 shrink-0 border-2 border-[#426795] object-cover lg:size-24"
                        src={mediaThumbnail(thumbnail)}
                        alt={thumbnail.alt_text || title}
                        loading="lazy"
                      />
                    ) : null}
                    <span className="min-w-0">
                      <span className="block text-xl font-bold leading-tight">
                        {title}
                      </span>
                      {eventType ? (
                        <span className="mt-1.5 inline-block border-2 border-[#426795] bg-[#426795] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[#F4EFE5]">
                          {eventType}
                        </span>
                      ) : null}
                      {dateText ? (
                        <span className="mt-1 block text-sm font-semibold">
                          {dateText}
                        </span>
                      ) : null}
                      {route.meta.canceled ? (
                        <span className="mt-1 inline-block border-2 border-[#ad3427] bg-[#ad3427] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[#ffffff]">
                          {t("visitorRoutes.canceled")}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          {totalPages > 1 ? (
            <nav
              className="flex items-center justify-between gap-4 border-t-2 border-[#D96543]/55 px-5 py-4 lg:px-6"
              aria-label={t("visitorRoutes.pagination")}
            >
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(0, value - 1))}
                disabled={currentPage === 0}
                className="border-2 border-[#426795] px-4 py-2 font-bold transition-colors not-disabled:hover:bg-[#D8BF9E] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#D96543] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← {t("visitorRoutes.previousPage")}
              </button>
              <span className="text-lg font-semibold">
                {t("visitorRoutes.pageStatus", {
                  page: currentPage + 1,
                  pages: totalPages,
                })}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((value) => Math.min(totalPages - 1, value + 1))
                }
                disabled={currentPage >= totalPages - 1}
                className="border-2 border-[#426795] px-4 py-2 font-bold transition-colors not-disabled:hover:bg-[#D8BF9E] focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#D96543] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t("visitorRoutes.nextPage")} →
              </button>
            </nav>
          ) : null}
        </div>
      ) : (
        <div className="w-full max-w-400 self-stretch">
          <button
            type="button"
            onClick={() => onRouteSelect(null)}
            className="mb-5 border-2 border-[#426795] bg-[#ffffff] px-5 py-2.5 text-lg font-bold shadow-[4px_4px_0_rgba(66,103,149,0.18)] transition-colors hover:bg-[#D8BF9E] focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#D96543]"
          >
            ← {t("visitorRoutes.backToList")}
          </button>

          <section
            ref={detailRef}
            className="min-h-90 scroll-mt-6 border-2 border-[#426795] bg-[#ffffff] p-5 shadow-[8px_8px_0_rgba(66,103,149,0.18)] lg:p-7"
            aria-live="polite"
          >
            {selectedRoute ? (
              <article>
                {featuredImage ? (
                  <img
                    className="aspect-[16/9] w-full border-2 border-[#426795] object-cover"
                    src={featuredImage.source_url}
                    alt={
                      featuredImage.alt_text ||
                      localizedRouteTitle(selectedRoute, language)
                    }
                  />
                ) : null}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {selectedRoute.meta.event_type ? (
                    <span className="border-2 border-[#426795] bg-[#426795] px-3 py-1 text-sm font-bold uppercase tracking-wide text-[#F4EFE5]">
                      {eventTypeLabel(selectedRoute)}
                    </span>
                  ) : null}
                  {selectedRoute.meta.canceled ? (
                    <span className="border-2 border-[#ad3427] bg-[#ad3427] px-3 py-1 text-sm font-bold uppercase tracking-wide text-[#ffffff]">
                      {t("visitorRoutes.canceled")}
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-4 text-3xl font-bold leading-tight lg:text-4xl">
                  {localizedRouteTitle(selectedRoute, language)}
                </h2>

                <dl className="mt-5 grid gap-x-6 gap-y-3 border-t-2 border-[#D96543]/55 pt-5 sm:grid-cols-2">
                  {formatRouteDates(selectedRoute, dateFormatter) ? (
                    <div>
                      <dt className="text-sm font-bold uppercase tracking-wide text-black/60">
                        {t("visitorRoutes.date")}
                      </dt>
                      <dd className="mt-0.5 text-lg font-semibold">
                        {formatRouteDates(selectedRoute, dateFormatter)}
                      </dd>
                    </div>
                  ) : null}

                  {selectedRoute.meta.event_time ? (
                    <div>
                      <dt className="text-sm font-bold uppercase tracking-wide text-black/60">
                        {t("visitorRoutes.time")}
                      </dt>
                      <dd className="mt-0.5 text-lg font-semibold">
                        {selectedRoute.meta.event_time}
                      </dd>
                    </div>
                  ) : null}

                  {selectedRoute.meta.duration ? (
                    <div>
                      <dt className="text-sm font-bold uppercase tracking-wide text-black/60">
                        {t("visitorRoutes.duration")}
                      </dt>
                      <dd className="mt-0.5 text-lg font-semibold">
                        {selectedRoute.meta.duration}
                      </dd>
                    </div>
                  ) : null}

                  {selectedRoute.meta.age_group ? (
                    <div>
                      <dt className="text-sm font-bold uppercase tracking-wide text-black/60">
                        {t("visitorRoutes.ageGroup")}
                      </dt>
                      <dd className="mt-0.5 text-lg font-semibold">
                        {selectedRoute.meta.age_group}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {localizedRouteText(selectedRoute, language) ? (
                  <div
                    className="mt-5 border-t-2 border-[#D96543]/55 pt-5 text-lg leading-relaxed [&_a]:font-bold [&_a]:text-[#426795] [&_p]:mb-3"
                    dangerouslySetInnerHTML={{
                      __html: localizedRouteText(selectedRoute, language),
                    }}
                  />
                ) : null}

                {qrCode ? (
                  <section className="mt-7 border-t-2 border-[#D96543]/55 pt-5">
                    <h3 className="text-xl font-extrabold text-[#426795]">
                      {t("visitorRoutes.qrCodeTitle")}
                    </h3>
                    <p className="mb-4 mt-1 text-lg leading-relaxed text-black/70">
                      {t("visitorRoutes.qrCodeHint")}
                    </p>
                    <img
                      className="w-44 border-2 border-[#426795] bg-[#ffffff]"
                      src={qrCode.source_url}
                      alt={t("visitorRoutes.qrCodeAlt", {
                        title: localizedRouteTitle(selectedRoute, language),
                      })}
                    />
                  </section>
                ) : null}
              </article>
            ) : (
              <p className="flex min-h-75 items-center text-xl font-semibold leading-relaxed text-black/65">
                {isLoading
                  ? t("visitorRoutes.loading")
                  : t("visitorRoutes.error")}
              </p>
            )}
          </section>
        </div>
      )}
    </SectionLayout>
  );
}

export default VisitorRoutes;
