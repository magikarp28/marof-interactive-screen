import { useEffect, useState } from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { useTranslation } from "react-i18next";
import "./App.css";
import LanguageSwitcher from "./components/LanguageSwitcher";
import type { SectionId } from "./sections/SectionLayout";
import AudioStories from "./sections/AudioStories";
import BeforeAfter from "./sections/BeforeAfter";
import InteractiveMap from "./sections/InteractiveMap";
import Timeline from "./sections/Timeline";
import VisitorRoutes from "./sections/VisitorRoutes";

import audioStoriesIcon from "./assets/images/audio priče.webp";
import interactiveMapIcon from "./assets/images/Interaktivna Karta.webp";
import visitorRoutesIcon from "./assets/images/posjetiteljske rute.webp";
import beforeAfterIcon from "./assets/images/prijeposlije.webp";
import timelineIcon from "./assets/images/Vremenska crta.webp";

type NavigationItem = {
  id: SectionId;
  image: string;
};

const navigationItems: NavigationItem[] = [
  { id: "routes", image: visitorRoutesIcon },
  { id: "map", image: interactiveMapIcon },
  { id: "audio", image: audioStoriesIcon },
  { id: "before-after", image: beforeAfterIcon },
  { id: "timeline", image: timelineIcon },
];

const transition: Transition = {
  type: "tween",
  ease: [0.22, 1, 0.36, 1],
  duration: 0.45,
};

function parsePath(): { section: SectionId | null; routeId: number | null } {
  const pathname = window.location.pathname;
  const routeMatch = pathname.match(/^\/(\d+)\/?$/);
  if (routeMatch) {
    return { section: "routes", routeId: Number(routeMatch[1]) };
  }

  if (/^\/routes\/?$/.test(pathname)) {
    return { section: "routes", routeId: null };
  }

  return { section: null, routeId: null };
}

function App() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(
    () => parsePath().section,
  );
  const [routeId, setRouteId] = useState<number | null>(
    () => parsePath().routeId,
  );
  const { t } = useTranslation();

  useEffect(() => {
    const handlePopState = () => {
      const { section, routeId } = parsePath();
      setRouteId(routeId);
      setActiveSection(section);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const closeSection = () => {
    setActiveSection(null);
    setRouteId(null);
    if (window.location.pathname !== "/") {
      window.history.pushState(null, "", "/");
    }
  };

  const handleRouteSelect = (id: number | null) => {
    setRouteId(id);
    window.history.pushState(null, "", id !== null ? `/${id}` : "/routes");
  };

  const section = activeSection
    ? {
        routes: (
          <VisitorRoutes
            onBack={closeSection}
            routeId={routeId}
            onRouteSelect={handleRouteSelect}
          />
        ),
        map: <InteractiveMap onBack={closeSection} />,
        audio: <AudioStories onBack={closeSection} />,
        "before-after": <BeforeAfter onBack={closeSection} />,
        timeline: <Timeline onBack={closeSection} />,
      }[activeSection]
    : null;

  return (
    <main className="relative h-[100dvh] overflow-hidden bg-[#426795] text-[#F4EFE5] [background-image:linear-gradient(115deg,rgba(255,255,255,0.055)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.055)_50%,rgba(255,255,255,0.055)_75%,transparent_75%)] [background-size:18px_18px]">
      <AnimatePresence mode="wait" initial={false}>
        {activeSection ? (
          <motion.div
            key={activeSection}
            className="absolute inset-0"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={transition}
          >
            {section}
          </motion.div>
        ) : (
          <motion.section
            key="home"
            className="mx-auto flex h-full max-w-480 flex-col overflow-y-auto px-4 py-5 sm:px-10 sm:py-9 lg:px-16 lg:py-12"
            initial={{ x: "-12%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-12%", opacity: 0 }}
            transition={transition}
          >
            <header className="flex shrink-0 items-end justify-between gap-6 border-b border-[#D8BF9E]/60 pb-7 portrait:flex-col portrait:items-start">
              <div className="">
                <p className="mb-2 text-lg font-semibold tracking-[0.24em] text-[#D8BF9E] uppercase">
                  {t("app.location")}
                </p>
                <h1 className="font-sans text-3xl font-semibold tracking-normal text-[#F4EFE5] sm:text-5xl lg:text-6xl">
                  {t("app.heading")}
                </h1>
                <p className="mt-4 max-w-3xlxl text-base leading-relaxed text-[#F4EFE5]/90 lg:text-lg">
                  {t("app.description")}
                </p>
              </div>
              <LanguageSwitcher />
            </header>

            <nav
              aria-label={t("app.navigation")}
              className="grid min-h-[42rem] flex-1 grid-cols-2 gap-5 py-7 sm:min-h-0 lg:gap-6 landscape:lg:grid-cols-5"
            >
              {navigationItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  type="button"
                  className="group flex min-h-0 flex-col items-center justify-between border-2 border-[#D96543] bg-white px-5 pt-5 pb-7 text-center text-black shadow-[0_12px_0_rgba(0,0,0,0.32)] outline-offset-6 transition-colors portrait:last:col-span-2 hover:bg-[#D8BF9E] focus-visible:outline-4 focus-visible:outline-[#D96543] active:translate-y-1 active:shadow-[0_7px_0_rgba(0,0,0,0.32)]"
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transition, delay: index * 0.06 }}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveSection(item.id);
                    if (item.id === "routes") {
                      window.history.pushState(null, "", "/routes");
                    }
                  }}
                >
                  <img
                    className="min-h-0 w-full flex-1 object-contain transition-transform duration-300 group-hover:scale-105"
                    src={item.image}
                    alt=""
                  />
                  <span className="mt-4 block min-h-14 text-2xl font-bold leading-tight lg:text-[1.45rem]">
                    {t(`sections.${item.id}`)}
                  </span>
                </motion.button>
              ))}
            </nav>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}

export default App;
