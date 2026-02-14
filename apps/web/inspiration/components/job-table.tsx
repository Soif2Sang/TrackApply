"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { EmailThreadSheet } from "@/components/email-thread-sheet";
import {
  ChevronRight,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobApplication } from "@/lib/gmail";

interface JobTableProps {
  applications: JobApplication[];
  onStatusChange?: (applicationId: string, newStatus: JobApplication["status"]) => void;
}

const ALL_STATUSES = [
  "applied",
  "interview",
  "offer",
  "rejected",
  "ghosted",
] as const;

type SortField = "company" | "position" | "status" | "appliedDate" | "lastUpdate";
type SortDirection = "asc" | "desc";

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatRelative(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  } catch {
    return dateStr;
  }
}

export function JobTable({ applications, onStatusChange }: JobTableProps) {
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatuses, setActiveStatuses] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("lastUpdate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleRowClick = (app: JobApplication) => {
    setSelectedApp(app);
    setSheetOpen(true);
  };

  const handleStatusChange = (applicationId: string, newStatus: JobApplication["status"]) => {
    onStatusChange?.(applicationId, newStatus);
    setSelectedApp((prev) =>
      prev && prev.id === applicationId ? { ...prev, status: newStatus } : prev
    );
  };

  const toggleStatus = (status: string) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveStatuses(new Set());
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "lastUpdate" || field === "appliedDate" ? "desc" : "asc");
    }
  };

  const hasFilters = searchQuery.length > 0 || activeStatuses.size > 0;

  const filtered = useMemo(() => {
    let result = [...applications];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (app) =>
          app.company.toLowerCase().includes(q) ||
          app.position.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (activeStatuses.size > 0) {
      result = result.filter((app) => activeStatuses.has(app.status));
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "company":
          cmp = a.company.localeCompare(b.company);
          break;
        case "position":
          cmp = a.position.localeCompare(b.position);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "appliedDate":
          cmp = new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
          break;
        case "lastUpdate":
          cmp = new Date(a.lastUpdate).getTime() - new Date(b.lastUpdate).getTime();
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [applications, searchQuery, activeStatuses, sortField, sortDirection]);

  if (applications.length === 0) {
    return null;
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 opacity-0 group-hover/sort:opacity-100 transition-opacity" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 text-accent" />
    ) : (
      <ArrowDown className="h-3 w-3 text-accent" />
    );
  };

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search company or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 bg-secondary border-border text-foreground text-xs font-mono placeholder:text-muted-foreground/60"
              aria-label="Search applications"
            />
          </div>

          {/* Status filter chips */}
          <div className="flex items-center gap-1.5">
            {ALL_STATUSES.map((status) => {
              const isActive = activeStatuses.has(status);
              const count = applications.filter((a) => a.status === status).length;
              if (count === 0) return null;
              return (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono transition-colors",
                    isActive
                      ? "bg-foreground text-background"
                      : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  aria-label={`Filter by ${status}`}
                  aria-pressed={isActive}
                >
                  <span className="capitalize">{status}</span>
                  <span
                    className={cn(
                      "tabular-nums",
                      isActive ? "text-background/70" : "text-muted-foreground/50"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Clear */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground font-mono gap-1"
            >
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>

        {/* Results count */}
        {hasFilters && (
          <span className="text-xs text-muted-foreground font-mono">
            {filtered.length} of {applications.length} applications
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead
                className="text-muted-foreground font-mono text-xs uppercase tracking-wider cursor-pointer group/sort"
                onClick={() => handleSort("company")}
              >
                <span className="flex items-center gap-1.5">
                  Company <SortIcon field="company" />
                </span>
              </TableHead>
              <TableHead
                className="text-muted-foreground font-mono text-xs uppercase tracking-wider cursor-pointer group/sort"
                onClick={() => handleSort("position")}
              >
                <span className="flex items-center gap-1.5">
                  Position <SortIcon field="position" />
                </span>
              </TableHead>
              <TableHead
                className="text-muted-foreground font-mono text-xs uppercase tracking-wider cursor-pointer group/sort"
                onClick={() => handleSort("status")}
              >
                <span className="flex items-center gap-1.5">
                  Status <SortIcon field="status" />
                </span>
              </TableHead>
              <TableHead
                className="text-muted-foreground font-mono text-xs uppercase tracking-wider hidden sm:table-cell cursor-pointer group/sort"
                onClick={() => handleSort("appliedDate")}
              >
                <span className="flex items-center gap-1.5">
                  Applied <SortIcon field="appliedDate" />
                </span>
              </TableHead>
              <TableHead
                className="text-muted-foreground font-mono text-xs uppercase tracking-wider text-right cursor-pointer group/sort"
                onClick={() => handleSort("lastUpdate")}
              >
                <span className="flex items-center gap-1.5 justify-end">
                  Last Update <SortIcon field="lastUpdate" />
                </span>
              </TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-sm text-muted-foreground font-mono"
                >
                  No applications match your filters
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((app) => (
                <TableRow
                  key={app.id}
                  className="cursor-pointer border-border group transition-colors"
                  onClick={() => handleRowClick(app)}
                >
                  <TableCell className="font-medium text-foreground">
                    {app.company}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {app.position}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={app.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm font-mono hidden sm:table-cell">
                    {formatDate(app.appliedDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm font-mono text-right">
                    {formatRelative(app.lastUpdate)}
                  </TableCell>
                  <TableCell className="pr-4">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition-colors" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EmailThreadSheet
        application={selectedApp}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
