import React, { useState, useEffect, useRef, useCallback } from "react";

// export default function FloatPanelSubtitles() {
//   return (
//   <div className="w-full h-full max-h-full max-w-full bg-black text-white flex flex-col">
//     <h1>Float Panel Subtitles</h1>
//   </div>
//   );
// }

interface Subtitle {
  author: string;
  text: string;
}

const FloatPanelSubtitles: React.FC = () => {
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const isUserScrollingRef = useRef(false);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
      setIsAutoScroll(true);
    }
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;

    // Check if user is at the bottom (within 10px)
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;

    // If user scrolled up manually, disable auto-scroll
    if (scrollTop < lastScrollTopRef.current && !isAtBottom) {
      setIsAutoScroll(false);
      isUserScrollingRef.current = true;
    }

    // If user scrolled back to bottom, enable auto-scroll
    if (isAtBottom) {
      setIsAutoScroll(true);
      isUserScrollingRef.current = false;
    }

    lastScrollTopRef.current = scrollTop;
  }, []);

  // Auto-scroll when new subtitles arrive
  useEffect(() => {
    if (
      isAutoScroll &&
      !isUserScrollingRef.current &&
      scrollContainerRef.current
    ) {
      scrollToBottom();
    }
  }, [subtitles, isAutoScroll, scrollToBottom]);

  // Clear subtitles
  const clearSubtitles = () => {
    setSubtitles([]);
  };

  // Add subtitle function (can be called from outside)
  const addSubtitle = (author: string, text: string) => {
    setSubtitles((prev) => [...prev, { author, text }]);
  };

  // Expose addSubtitle function to window for external access
  useEffect(() => {
    (window as any).addSubtitle = addSubtitle;
    console.log("FloatPanelSubtitles: addSubtitle function exposed to window");
    return () => {
      delete (window as any).addSubtitle;
      console.log(
        "FloatPanelSubtitles: addSubtitle function removed from window"
      );
    };
  }, [addSubtitle]);

  return (
    <div className="w-screen h-screen bg-white flex flex-col border border-gray-200 rounded-sm shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-medium text-gray-900">Субтитри</h2>
        <button
          onClick={clearSubtitles}
          className="inline-flex items-center justify-center h-6 px-2 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
        >
          Очистити
        </button>
      </div>

      {/* Subtitles container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-2"
      >
        {subtitles.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">Субтитри з'являться тут</p>
          </div>
        ) : (
          subtitles.map((subtitle, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded p-2 border-l-2 border-blue-500"
            >
              <div className="text-xs text-blue-600 font-medium mb-1">
                {subtitle.author}:
              </div>
              <div className="text-sm text-gray-900 leading-relaxed">
                {subtitle.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isAutoScroll ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          <span className="text-xs text-gray-600">
            {isAutoScroll ? "Авто-прокрутка" : "Ручне керування"}
          </span>
        </div>

        <button
          onClick={scrollToBottom}
          className="inline-flex items-center gap-1 h-6 px-2 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
          Вниз
        </button>
      </div>
    </div>
  );
};
export default FloatPanelSubtitles;
