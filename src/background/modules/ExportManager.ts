/**
 * ExportManager - управління експортом даних
 */

export interface ExportData {
  content: string;
  mimeType: string;
  filename: string;
}

export class ExportManager {
  /**
   * Форматує дані сесії для експорту
   */
  static formatCaptionData(sessionData: any, format: string): ExportData {
    const timestamp = new Date(sessionData.timestamp)
      .toISOString()
      .replace(/[:.]/g, "-");
    const baseFilename = `captions_${timestamp}`;

    switch (format.toLowerCase()) {
      case "json":
        return {
          content: JSON.stringify(sessionData, null, 2),
          mimeType: "application/json",
          filename: `${baseFilename}.json`,
        };

      case "txt":
        const txtContent = sessionData.captions
          .map(
            (caption: any) =>
              `[${caption.timestamp}] ${caption.speaker}: ${caption.text}`
          )
          .join("\n");
        return {
          content: txtContent,
          mimeType: "text/plain",
          filename: `${baseFilename}.txt`,
        };

      case "srt":
        const srtContent = sessionData.captions
          .map((caption: any, index: number) => {
            const startTime = this.formatSRTTime(new Date(caption.timestamp));
            const endTime = this.formatSRTTime(
              new Date(new Date(caption.timestamp).getTime() + 3000)
            ); // 3 seconds duration
            return `${index + 1}\n${startTime} --> ${endTime}\n${
              caption.speaker
            }: ${caption.text}\n`;
          })
          .join("\n");
        return {
          content: srtContent,
          mimeType: "text/plain",
          filename: `${baseFilename}.srt`,
        };

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Форматує час для SRT файлу
   */
  private static formatSRTTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const milliseconds = date.getMilliseconds().toString().padStart(3, "0");
    return `${hours}:${minutes}:${seconds},${milliseconds}`;
  }

  /**
   * Експортує дані сесії
   */
  static async exportSessionData(
    sessionData: any,
    format: string = "json"
  ): Promise<string> {
    const exportData = this.formatCaptionData(sessionData, format);
    const blob = new Blob([exportData.content], { type: exportData.mimeType });
    const url = URL.createObjectURL(blob);

    // Trigger download
    chrome.downloads.download({
      url: url,
      filename: exportData.filename,
      saveAs: true,
    });

    return exportData.filename;
  }
}
