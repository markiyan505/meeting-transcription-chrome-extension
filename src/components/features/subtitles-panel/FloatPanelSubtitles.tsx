import React, { useState, useEffect, useRef, useCallback } from "react";
import { Trash2, ChevronDown, RotateCcw, Eye, EyeOff } from "lucide-react";

interface Subtitle {
  author: string;
  text: string;
}

const FloatPanelSubtitles: React.FC = () => {
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
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

  // Expose functions to window for external access
  useEffect(() => {
    (window as any).addSubtitle = addSubtitle;
    (window as any).clearSubtitles = clearSubtitles;
    return () => {
      delete (window as any).addSubtitle;
      delete (window as any).clearSubtitles;
    };
  }, [addSubtitle, clearSubtitles]);

  return (
    <div className="w-screen h-screen bg-secondary text-foreground flex flex-col border border-border rounded-sm shadow-lg">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Subtitles
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAutoScroll(!isAutoScroll)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAutoScroll ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAutoScroll ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <button
              onClick={clearSubtitles}
              className="inline-flex items-center justify-center h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="inline-flex items-center justify-center h-8 w-8 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            >
              {isMinimized ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isAutoScroll ? "bg-green-500" : "bg-muted-foreground"
              }`}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {isAutoScroll ? "Auto-scroll" : "Manual control"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {subtitles.length} records
          </span>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <>
          {/* Subtitles container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {subtitles.length === 0 ? (
              <div className="text-center text-muted-foreground mt-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium">
                  Subtitles will appear here
                </p>
                <p className="text-xs mt-1">Start recording to see subtitles</p>
              </div>
            ) : (
              subtitles.map((subtitle, index) => (
                <div
                  key={index}
                  className="p-3 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-primary">
                        {subtitle.author.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-primary mb-1">
                        {subtitle.author}
                      </div>
                      <div className="text-sm text-foreground leading-relaxed">
                        {subtitle.text}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="bg-card border-t border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isAutoScroll ? "bg-green-500" : "bg-muted-foreground"
                  }`}
                />
                <span className="text-xs text-muted-foreground">
                  {isAutoScroll ? "Auto-scroll" : "Manual control"}
                </span>
              </div>

              <button
                onClick={scrollToBottom}
                className="inline-flex items-center space-x-1 h-8 px-3 text-xs font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <ChevronDown className="w-3 h-3" />
                <span>Down</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default FloatPanelSubtitles;
