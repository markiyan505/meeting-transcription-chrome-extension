export interface LastRecordData {
  id: string;
  title: string;
  time: string;
  duration: string;
  platform: string;
  captionCount: number;
  messageCount: number;
  attendeeCount: number;
  isSynced: boolean;
}

export interface LastRecordProps {
  record: LastRecordData;
  onSyncRecord?: (id: string) => void;
  onOpenRecord?: (id: string) => void;
  onExportRecord?: (id: string) => void;
  onDeleteRecord?: (id: string) => void;
}
