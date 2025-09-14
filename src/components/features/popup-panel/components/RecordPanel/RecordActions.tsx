import React from "react";
import { Button } from "@/components/shared/ui/button/Button";
import { RefreshCw, ExternalLink, Download, Trash2 } from "lucide-react";

interface RecordActionsProps {
  isSynced: boolean;
  recordId: string;
  onSyncRecord?: (id: string) => void;
  onOpenRecord?: (id: string) => void;
  onExportRecord?: (id: string) => void;
  onDeleteRecord?: (id: string) => void;
}

export const RecordActions: React.FC<RecordActionsProps> = ({
  isSynced,
  recordId,
  onSyncRecord,
  onOpenRecord,
  onExportRecord,
  onDeleteRecord,
}) => {
  return (
    <div className="flex flex-col justify-between items-end">
      <div className="flex flex-row justify-between gap-1">
        {!isSynced ? (
          <Button
            onClick={() => onSyncRecord?.(recordId)}
            variant="ghost"
            size="sm_square"
            leftIcon={<RefreshCw />}
            tooltip="Sync record"
          />
        ) : (
          <Button
            onClick={() => onOpenRecord?.(recordId)}
            variant="ghost"
            size="sm_square"
            leftIcon={<ExternalLink />}
            tooltip="Open record in analytics"
          />
        )}
        <Button
          onClick={() => onExportRecord?.(recordId)}
          variant="ghost"
          size="sm_square"
          leftIcon={<Download />}
          tooltip="Export record"
        />
      </div>

      <Button
        onClick={() => onDeleteRecord?.(recordId)}
        variant="ghost"
        size="sm_square"
        leftIcon={<Trash2 />}
        tooltip="Delete record"
        className="text-destructive hover:text-destructive"
      />
    </div>
  );
};
