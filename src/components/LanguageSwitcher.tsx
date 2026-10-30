import { useTranslation } from "react-i18next";

const languages = [
  { code: "hr", label: "HR" },
  { code: "en", label: "EN" },
] as const;

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div
      aria-label={t("languageSwitcher.label")}
      className="inline-flex border border-[#D96543]/75 p-1"
      role="group"
    >
      {languages.map((language) => (
        <button
          key={language.code}
          type="button"
          aria-pressed={activeLanguage === language.code}
          className={`min-w-15 px-4 py-2 text-base font-bold tracking-[0.12em] transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#D96543] ${
            activeLanguage === language.code
              ? "bg-[#D96543] text-black"
              : "text-[#F4EFE5] hover:bg-[#D96543]/20"
          }`}
          onClick={() => i18n.changeLanguage(language.code)}
        >
          {language.label}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
