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
};

function SectionLayout({ title, onBack, children }: SectionLayoutProps) {
  const { t } = useTranslation();

  return (
    <section className="flex h-full flex-col bg-[#F4EFE5] text-black">
      <header className="flex items-center justify-between gap-6 border-b-4 border-[#D96543] bg-[#426795] px-10 py-7 text-[#F4EFE5] portrait:flex-col portrait:items-start lg:px-16">
        <h1 className="text-4xl font-semibold lg:text-5xl">{title}</h1>
        <div className="flex items-center gap-5">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={onBack}
            className="border-2 border-[#D96543] px-7 py-3 text-xl font-bold text-[#F4EFE5] transition-colors hover:bg-[#D96543] hover:text-black focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#D96543]"
          >
            {t("app.back")}
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-10 py-12 lg:px-16">
        {children}
      </div>
    </section>
  );
}

export default SectionLayout;
