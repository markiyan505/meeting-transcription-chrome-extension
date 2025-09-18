import type { SessionData } from "../../types/session";
import { AuthManager } from "./AuthManager";
import { supabase } from "../supabaseClient";

interface TipTapNode {
  type: string;
  attrs?: any;
  content?: TipTapNode[];
  text?: string;
  marks?: any[];
}

interface TipTapDocument {
  type: "doc";
  content: TipTapNode[];
}

export class JobManager {
  private static convertSessionDataToTipTapJson(
    sessionData: SessionData
  ): TipTapDocument {
    const content: TipTapNode[] = [];

    if (sessionData.meetingInfo?.title) {
      content.push({
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: sessionData.meetingInfo.title }],
      });
    }

    const metadataItems: TipTapNode[] = [];
    if (sessionData.meetingInfo?.platform) {
      metadataItems.push({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Platform: ", marks: [{ type: "bold" }] },
              { type: "text", text: sessionData.meetingInfo.platform },
            ],
          },
        ],
      });
    }
    if (sessionData.recordTimings?.startTime) {
      const formattedDate = new Date(
        sessionData.recordTimings.startTime
      ).toLocaleString();
      metadataItems.push({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Started at: ", marks: [{ type: "bold" }] },
              { type: "text", text: formattedDate },
            ],
          },
        ],
      });
    }

    if (metadataItems.length > 0) {
      content.push({
        type: "bulletList",
        content: metadataItems,
      });
    }

    content.push({
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Transcript" }],
    });

    if (sessionData.captions && sessionData.captions.length > 0) {
      const captionItems: TipTapNode[] = sessionData.captions.map(
        (caption) => ({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `${caption.speaker}: `,
                  marks: [{ type: "bold" }],
                },
                {
                  type: "text",
                  text: caption.text,
                },
              ],
            },
          ],
        })
      );

      content.push({
        type: "bulletList",
        content: captionItems,
      });
    } else {
      content.push({
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "No captions were recorded for this session.",
            marks: [{ type: "italic" }],
          },
        ],
      });
    }

    return {
      type: "doc",
      content,
    };
  }

  static async saveSession(sessionData: SessionData): Promise<void> {
    try {
      console.log("[SessionManager] Starting to save session:", sessionData);
      if (!this.hasData(sessionData)) {
        console.log(
          "[SessionManager] Skipped saving: session contains no meaningful data."
        );
        return;
      }

      const user = await AuthManager.getUser();
      if (!user) {
        console.error(
          "[SessionManager] Cannot save session: User is not authenticated."
        );
        return;
      }
      const userId = user.id;

      console.log(
        "[SessionManager] Step 1: Transforming session data to TipTap format..."
      );
      const tipTapContent = this.convertSessionDataToTipTapJson(sessionData);

      console.log(
        "[SessionManager] Step 2: Creating job with initial content..."
      );
      const { data: jobId, error: jobError } = await supabase.rpc(
        "fn_create_job_meeting_transcript",
        {
          p_user_id: userId,
          p_job_title: sessionData.meetingInfo?.title || "Untitled Meeting",
          p_tiptap_content: tipTapContent,
        }
      );

      if (jobError) {
        throw new Error(`Error creating job: ${jobError.message}`);
      }

      console.log("[SessionManager] Step 3: Creating the first job version...");
      const { data: versionData, error: versionError } = await supabase.rpc(
        "create_job_version",
        {
          p_job_id: jobId,
          p_editor_content: tipTapContent,
          p_saved_by: userId,
        }
      );

      if (versionError) {
        throw new Error(`Error creating job version: ${versionError.message}`);
      }

      console.log(
        `[SessionManager] Session saved successfully. New version ID: ${versionData.version_id}`
      );
    } catch (error) {
      console.error(
        "❌ [SessionManager] Failed to save session to the database:",
        error
      );
    }
  }

  static hasData(sessionData: SessionData): boolean {
    if (!sessionData) return false;
    const hasCaptions = sessionData.captions && sessionData.captions.length > 0;
    return hasCaptions;
  }
}
