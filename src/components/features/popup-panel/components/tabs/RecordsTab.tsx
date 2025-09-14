import React, { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/shared/ui/input/Input";
import { DropdownSelect } from "@/components/shared/ui/dropdown-select/DropdownSelect";
import { Typography } from "@/components/shared/ui/typography";
import { LastRecord } from "../Cards/record-card/RecordPanel";
import { type MockRecord } from "../../data/mockData";

interface RecordsTabProps {
  records: MockRecord[];
  onViewRecord: (id: string) => void;
  onExportRecord: (id: string) => void;
  onDeleteRecord: (id: string) => void;
  onSyncRecord: (id: string) => void;
}

const RecordsTab: React.FC<RecordsTabProps> = ({
  records,
  onViewRecord,
  onExportRecord,
  onDeleteRecord,
  onSyncRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title" | "duration">("date");
  const [filterPlatform, setFilterPlatform] = useState<
    "all" | "google-meet" | "teams"
  >("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "synced" | "unsynced"
  >("all");

  const platformOptions = [
    { value: "all", label: "All platforms" },
    { value: "google-meet", label: "Google Meet" },
    { value: "teams", label: "Microsoft Teams" },
  ];

  const statusOptions = [
    { value: "all", label: "All statuses" },
    { value: "synced", label: "Synced" },
    { value: "unsynced", label: "Not synced" },
  ];

  const filteredRecords = records
    .filter((record) => {
      const matchesSearch = record.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesPlatform =
        filterPlatform === "all" || record.platform === filterPlatform;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "synced" && record.isSynced) ||
        (filterStatus === "unsynced" && !record.isSynced);

      return matchesSearch && matchesPlatform && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "duration":
          return b.duration.localeCompare(a.duration);
        case "date":
        default:
          return new Date(b.time).getTime() - new Date(a.time).getTime();
      }
    });

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="space-y-4 flex-shrink-0">
        <Input
          placeholder="Search records..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value)
          }
          size="default"
          variant="outline"
          leftIcon={Search}
        />

        <div className="flex space-x-2">
          <DropdownSelect
            options={platformOptions}
            value={filterPlatform}
            onChange={(value: string) =>
              setFilterPlatform(value as "all" | "google-meet" | "teams")
            }
            size="sm"
            variant="outline"
            className="flex-1"
            placeholder="All platforms"
          />
          <DropdownSelect
            options={statusOptions}
            value={filterStatus}
            onChange={(value: string) =>
              setFilterStatus(value as "all" | "synced" | "unsynced")
            }
            size="sm"
            variant="outline"
            className="flex-1"
            placeholder="All statuses"
          />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin min-w-0 mt-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-10">
            <Typography variant="caption" color="muted">
              No records found.
            </Typography>
          </div>
        ) : (
          filteredRecords.map((record) => (
            <LastRecord
              key={record.id}
              record={{
                id: record.id,
                title: record.title,
                time: record.time,
                duration: record.duration,
                platform: record.platform,
                captionCount: record.captionCount,
                messageCount: record.messageCount,
                attendeeCount: record.attendeeCount,
                isSynced: record.isSynced,
              }}
              onSyncRecord={onSyncRecord}
              onOpenRecord={onViewRecord}
              onExportRecord={onExportRecord}
              onDeleteRecord={onDeleteRecord}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default RecordsTab;
