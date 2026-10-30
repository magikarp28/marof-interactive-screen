import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAudioStories } from "../hooks/useCmsData";
import type { AudioStory } from "../api/wordpress";
import SectionLayout from "./SectionLayout";

type AudioStoriesProps = {
  onBack: () => void;
};

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function AudioStories({ onBack }: AudioStoriesProps) {
  const { t, i18n } = useTranslation();
  const { data: stories, isLoading, error } = useAudioStories();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [activeStoryId, setActiveStoryId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const language = i18n.resolvedLanguage === "en" ? "en" : "hr";
  const activeStory = stories.find((story) => story.id === activeStoryId);
  const activeAudioUrl =
    activeStory?.audio[language].url ?? activeStory?.audio.hr.url ?? null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeAudioUrl) {
      return;
    }

    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
      return;
    }

    audio.pause();
  }, [activeAudioUrl, isPlaying]);

  function getAudioUrl(story: AudioStory) {
    return story.audio[language].url ?? story.audio.hr.url;
  }

  function handlePlayPause(story: AudioStory) {
    if (!getAudioUrl(story)) {
      return;
    }

    if (story.id !== activeStoryId) {
      setActiveStoryId(story.id);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(true);
      return;
    }

    setIsPlaying((playing) => !playing);
  }

  function handleSeek(event: React.ChangeEvent<HTMLInputElement>) {
    const time = Number(event.target.value);
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.currentTime = time;
    setCurrentTime(time);
  }

  return (
    <SectionLayout title={t("sections.audio")} onBack={onBack}>
      <audio
        ref={audioRef}
        src={activeAudioUrl ?? undefined}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) =>
          setCurrentTime(event.currentTarget.currentTime)
        }
        onEnded={() => setIsPlaying(false)}
      />

      <div className="w-full max-w-260 self-stretch overflow-y-auto py-1 pr-2">
        {isLoading ? (
          <p className="text-xl font-semibold">{t("audioStories.loading")}</p>
        ) : null}

        {error ? (
          <p
            className="border-2 border-[#ad3427] bg-[#ffffff] px-5 py-4 text-xl font-semibold text-[#7b2119]"
            role="alert"
          >
            {t("audioStories.error")}
          </p>
        ) : null}

        {!isLoading && !error && stories.length === 0 ? (
          <p className="text-xl font-semibold">{t("audioStories.empty")}</p>
        ) : null}

        <ol className="space-y-4">
          {stories.map((story, index) => {
            const isActive = story.id === activeStoryId;
            const audioUrl = getAudioUrl(story);
            const storyTitle = story.title[language] || story.title.hr;

            return (
              <li key={story.id}>
                <article
                  className={`border-2 p-5 shadow-[6px_6px_0_rgba(66,103,149,0.18)] lg:p-6 ${
                    isActive
                      ? "border-[#D96543] bg-[#F4EFE5]"
                      : "border-black/30 bg-[#ffffff]"
                  }`}
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <span className="text-sm font-bold tracking-[0.14em] text-[#D96543] uppercase">
                      {t("audioStories.storyNumber", { number: index + 1 })}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-bold leading-tight lg:text-3xl">
                        {storyTitle}
                      </h2>
                      {story.author ? (
                        <p className="mt-1 text-base font-semibold text-black/65">
                          {t("audioStories.author", { author: story.author })}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePlayPause(story)}
                      disabled={!audioUrl}
                      aria-label={
                        isActive && isPlaying
                          ? t("audioStories.pause", { title: storyTitle })
                          : t("audioStories.play", { title: storyTitle })
                      }
                      className="shrink-0 border-2 border-[#426795] bg-[#426795] px-6 py-3 text-base font-bold text-[#F4EFE5] transition-colors hover:bg-[#D96543] hover:text-black focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#D96543] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {isActive && isPlaying
                        ? t("audioStories.pauseLabel")
                        : t("audioStories.playLabel")}
                    </button>
                  </div>

                  {isActive ? (
                    <div className="mt-5 border-t-2 border-[#D96543]/55 pt-5">
                      <div className="flex items-center gap-3 text-sm font-bold tabular-nums">
                        <span>{formatDuration(currentTime)}</span>
                        <input
                          className="h-2 min-w-0 flex-1 accent-[#D96543]"
                          type="range"
                          min="0"
                          max={duration || 0}
                          step="0.1"
                          value={Math.min(currentTime, duration || 0)}
                          onChange={handleSeek}
                          aria-label={t("audioStories.seek", {
                            title: storyTitle,
                          })}
                        />
                        <span>{formatDuration(duration)}</span>
                      </div>
                      {story.audio[language].transcript ? (
                        <details className="mt-5 border-l-4 border-[#D96543] pl-4">
                          <summary className="cursor-pointer font-bold">
                            {t("audioStories.transcript")}
                          </summary>
                          <div
                            className="mt-3 leading-relaxed [&_a]:font-bold [&_a]:text-[#426795] [&_p]:mb-3"
                            dangerouslySetInnerHTML={{
                              __html: story.audio[language].transcript,
                            }}
                          />
                        </details>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </SectionLayout>
  );
}

export default AudioStories;
