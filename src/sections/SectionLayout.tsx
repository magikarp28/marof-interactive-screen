import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";

export type SectionId =
  | "routes"
  | "map"
  | "audio"
  | "before-after"
  | "timeline";

type SectionLayoutProps = {
  title: string;
  onBack: () => void;
  children?: ReactNode;
  compactOnMobile?: boolean;
  className?: string;
};

function SectionLayout({ title, onBack, children, compactOnMobile = false, className = "" }: SectionLayoutProps) {
  const { t } = useTranslation();

  return (
    <section className={`flex h-full flex-col bg-[#F4EFE5] text-black ${compactOnMobile ? "map-section" : ""} ${className}`}>
      <header className={`flex items-center justify-between gap-6 border-b-4 border-[#D96543] bg-[#426795] text-[#F4EFE5] portrait:flex-col portrait:items-start lg:px-16 ${compactOnMobile ? "map-section-header px-4 py-4 sm:px-10 sm:py-7" : "px-10 py-7"}`}>
        <h1 className={`font-semibold lg:text-5xl ${compactOnMobile ? "map-section-title text-2xl sm:text-4xl" : "text-4xl"}`}>{title}</h1>
        <div className={`flex items-center gap-5 ${compactOnMobile ? "map-section-actions" : ""}`}>
          <LanguageSwitcher />
          <button
            type="button"
            onClick={onBack}
            className={`border-2 border-[#D96543] px-7 py-3 text-xl font-bold text-[#F4EFE5] transition-colors hover:bg-[#D96543] hover:text-black focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#D96543] ${compactOnMobile ? "map-section-back" : ""}`}
          >
            {t("app.back")}
          </button>
        </div>
      </header>
      <div className={`flex min-h-0 flex-1 items-center justify-center overflow-y-auto lg:px-16 ${compactOnMobile ? "map-section-content px-4 py-4 sm:px-10 sm:py-12" : "px-10 py-12"}`}>
        {children}
      </div>
    </section>
  );
}

export default SectionLayout;
