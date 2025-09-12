/**
 * Утиліти для форматування субтитрів у різні формати експорту
 */
import { CaptionEntry, ExportOptions, MeetingInfo } from "./types";

interface ExportData {
  meetingInfo: MeetingInfo;
  captions: CaptionEntry[];
  chatMessages: any[];
}

export function formatAsText(data: ExportData, options: ExportOptions): string {
  let content = `Meeting: ${data.meetingInfo.title}\n`;
  content += `Date: ${new Date(
    data.meetingInfo.startTime
  ).toLocaleString()}\n`;
  content += `Platform: ${data.meetingInfo.platform}\n\n`;

  if (options.includeSpeakers && options.includeTimestamps) {
    data.captions.forEach((caption: CaptionEntry) => {
      content += `[${new Date(caption.timestamp).toLocaleTimeString()}] ${
        caption.speaker
      }: ${caption.text}\n`;
    });
  } else if (options.includeSpeakers) {
    data.captions.forEach((caption: CaptionEntry) => {
      content += `${caption.speaker}: ${caption.text}\n`;
    });
  } else {
    data.captions.forEach((caption: CaptionEntry) => {
      content += `${caption.text}\n`;
    });
  }
  return content;
}

export function formatAsSRT(
  captions: CaptionEntry[],
  options: ExportOptions
): string {
  // SRT вимагає точного таймінгу, якого ми не маємо.
  // Це спрощена реалізація. Для повноцінної підтримки потрібно зберігати startTime/endTime для кожного субтитру.
  let content = "";
  captions.forEach((caption, index) => {
    const startTime = new Date(caption.timestamp).getTime();
    const srtTime = (seconds: number) =>
      new Date(seconds * 1000).toISOString().substr(11, 12).replace(".", ",");

    content += `${index + 1}\n`;
    // Placeholder-час, оскільки у нас немає тривалості
    content += `${srtTime(index * 5)} --> ${srtTime(index * 5 + 3)}\n`;
    if (options.includeSpeakers) {
      content += `${caption.speaker}: ${caption.text}\n\n`;
    } else {
      content += `${caption.text}\n\n`;
    }
  });
  return content;
}

export function formatAsVTT(
  captions: CaptionEntry[],
  options: ExportOptions
): string {
  // Аналогічно до SRT, це спрощена реалізація.
  let content = "WEBVTT\n\n";
  captions.forEach((caption, index) => {
    const vttTime = (seconds: number) =>
      new Date(seconds * 1000).toISOString().substr(11, 12);

    // Placeholder-час
    content += `${vttTime(index * 5)} --> ${vttTime(index * 5 + 3)}\n`;
    if (options.includeSpeakers) {
      content += `<v ${caption.speaker}>${caption.text}</v>\n\n`;
    } else {
      content += `${caption.text}\n\n`;
    }
  });
  return content;
}

export function formatAsCSV(
  captions: CaptionEntry[],
  options: ExportOptions
): string {
  let content = "Timestamp,Speaker,Text\n";
  captions.forEach((caption) => {
    const text = caption.text.replace(/"/g, '""'); // екранування лапок
    content += `"${caption.timestamp}","${caption.speaker}","${text}"\n`;
  });
  return content;
}