import React, { useState } from "react";
import { Search, Eye, Download, Trash2, RefreshCw, CheckCircle, XCircle, FileText, Users } from "lucide-react";

interface Record {
  id: string;
  title: string;
  time: string;
  duration: string;
  platform: "google-meet" | "teams";
  isSynced: boolean;
  captionCount: number;
  attendeeCount: number;
}

interface RecordsTabProps {
  records: Record[];
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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "google-meet":
        return "🔵";
      case "teams":
        return "🟢";
      default:
        return "⚪";
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case "google-meet":
        return "Google Meet";
      case "teams":
        return "Microsoft Teams";
      default:
        return "Unknown";
    }
  };

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
      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search records..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg focus:ring-2 focus:ring-ring" />
        </div>
  
        <div className="flex space-x-2">
          <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value as any)} className="flex-1 px-3 py-1.5 border border-border rounded-md text-sm bg-card focus:ring-2 focus:ring-ring">
            <option value="all">All platforms</option>
            <option value="google-meet">Google Meet</option>
            <option value="teams">Microsoft Teams</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="flex-1 px-3 py-1.5 border border-border rounded-md text-sm bg-card focus:ring-2 focus:ring-ring">
            <option value="all">All statuses</option>
            <option value="synced">Synced</option>
            <option value="unsynced">Not synced</option>
          </select>
        </div>
  
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-10"><p className="text-muted-foreground">No records found.</p></div>
          ) : (
            filteredRecords.map((record) => (
              <div key={record.id} className="p-3 bg-card border border-border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1.5">{record.title}</p>
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <span className="flex items-center"><FileText className="w-3 h-3 mr-1" />{record.captionCount}</span>
                      <span className="flex items-center"><Users className="w-3 h-3 mr-1" />{record.attendeeCount}</span>
                      {record.isSynced ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                    </div>
                  </div>
                  <div className="flex items-center space-x-0.5">
                    {!record.isSynced && <button onClick={() => onSyncRecord(record.id)} className="p-1.5 text-muted-foreground hover:text-primary"><RefreshCw className="w-4 h-4" /></button>}
                    <button onClick={() => onExportRecord(record.id)} className="p-1.5 text-muted-foreground hover:text-primary"><Download className="w-4 h-4" /></button>
                    <button onClick={() => onDeleteRecord(record.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };
  
  export default RecordsTab;