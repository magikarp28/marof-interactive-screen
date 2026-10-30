import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBeforeAfters, useWordPressMedia } from "../hooks/useCmsData";
import SectionLayout from "./SectionLayout";

type BeforeAfterProps = {
  onBack: () => void;
};

function BeforeAfter({ onBack }: BeforeAfterProps) {
  const { t } = useTranslation();
  const { data: entries, isLoading, error } = useBeforeAfters();
  const imageIds = entries.flatMap((entry) => [
    entry.meta.before_image_id,
    entry.meta.after_image_id,
  ]);
  const { data: media, isLoading: isMediaLoading } =
    useWordPressMedia(imageIds);
  const mediaById = new Map(media.map((item) => [item.id, item]));

  return (
    <SectionLayout title={t("sections.before-after")} onBack={onBack}>
      <div className="w-full max-w-260 self-stretch overflow-y-auto py-1 pr-2">
        {isLoading ? (
          <p className="text-xl font-semibold">{t("beforeAfter.loading")}</p>
        ) : null}

        {error ? (
          <p
            className="border-2 border-[#ad3427] bg-[#ffffff] px-5 py-4 text-xl font-semibold text-[#7b2119]"
            role="alert"
          >
            {t("beforeAfter.error")}
          </p>
        ) : null}

        {!isLoading && !error && entries.length === 0 ? (
          <p className="text-xl font-semibold">{t("beforeAfter.empty")}</p>
        ) : null}

        <ol className="space-y-10 pb-1">
          {entries.map((entry) => {
            const beforeImage = mediaById.get(entry.meta.before_image_id);
            const afterImage = mediaById.get(entry.meta.after_image_id);

            return (
              <li key={entry.id}>
                <BeforeAfterComparison
                  title={entry.title.rendered}
                  beforeImage={beforeImage}
                  afterImage={afterImage}
                  isLoading={isMediaLoading}
                />
              </li>
            );
          })}
        </ol>
      </div>
    </SectionLayout>
  );
}

type BeforeAfterComparisonProps = {
  title: string;
  beforeImage: { source_url: string; alt_text: string } | undefined;
  afterImage: { source_url: string; alt_text: string } | undefined;
  isLoading: boolean;
};

function BeforeAfterComparison({
  title,
  beforeImage,
  afterImage,
  isLoading,
}: BeforeAfterComparisonProps) {
  const { t } = useTranslation();
  const [position, setPosition] = useState(50);
  const textTitle = title.replace(/<[^>]*>/g, "");

  if (isLoading) {
    return (
      <p className="text-xl font-semibold">{t("beforeAfter.loadingImages")}</p>
    );
  }

  if (!beforeImage || !afterImage) {
    return (
      <p className="text-xl font-semibold">
        {t("beforeAfter.imageUnavailable")}
      </p>
    );
  }

  return (
    <article>
      <h2
        className="text-2xl font-bold leading-tight lg:text-3xl"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <div className="mt-4 overflow-hidden border-2 border-[#426795] bg-[#426795] shadow-[6px_6px_0_rgba(66,103,149,0.18)]">
        <div className="relative aspect-[4/3] select-none">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src={afterImage.source_url}
            alt={
              afterImage.alt_text ||
              t("beforeAfter.afterImage", { title: textTitle })
            }
          />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          >
            <img
              className="h-full w-full object-cover"
              src={beforeImage.source_url}
              alt=""
            />
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 z-10 w-1 -translate-x-1/2 bg-[#F4EFE5] shadow-[0_0_0_1px_#426795]"
            style={{ left: `${position}%` }}
          >
            <span className="absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#426795] bg-[#F4EFE5] text-lg font-bold text-black">
              <span aria-hidden="true">&#8596;</span>
            </span>
          </div>
          <input
            className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
            type="range"
            min="0"
            max="100"
            value={position}
            onChange={(event) => setPosition(Number(event.target.value))}
            aria-label={t("beforeAfter.compare", { title: textTitle })}
          />
          <span className="absolute top-4 left-4 bg-[#426795] px-3 py-1 text-sm font-bold tracking-[0.08em] text-[#F4EFE5] uppercase">
            {t("beforeAfter.before")}
          </span>
          <span className="absolute top-4 right-4 bg-[#F4EFE5] px-3 py-1 text-sm font-bold tracking-[0.08em] text-black uppercase">
            {t("beforeAfter.after")}
          </span>
        </div>
      </div>
    </article>
  );
}

export default BeforeAfter;
