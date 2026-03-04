import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { StatusBadge } from "./status-badge";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

type SortField = "company" | "position" | "status" | "appliedDate" | "lastUpdate";
type SortDirection = "asc" | "desc";

interface JobApplicationsTableProps {
  searchQuery?: string;
  statusFilter?: string[];
}

export function JobApplicationsTable({ searchQuery = "", statusFilter = [] }: JobApplicationsTableProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>("lastUpdate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  
  const { data: applications, isLoading } = useQuery(trpc.jobTracking.getApplications.queryOptions());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "lastUpdate" || field === "appliedDate" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-0 group-hover/sort:opacity-100 transition-opacity ml-1 inline" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 text-accent ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 text-accent ml-1 inline" />
    );
  };

  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    
    let result = applications.filter((app) => {
      const matchesSearch = !searchQuery || 
        (app.company?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
        (app.position?.toLowerCase() ?? "").includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(app.currentStatus);
      
      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "company":
          cmp = (a.company ?? "").localeCompare(b.company ?? "");
          break;
        case "position":
          cmp = (a.position ?? "").localeCompare(b.position ?? "");
          break;
        case "status":
          cmp = a.currentStatus.localeCompare(b.currentStatus);
          break;
        case "appliedDate":
          cmp = new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
          break;
        case "lastUpdate":
          cmp = new Date(a.lastUpdateAt).getTime() - new Date(b.lastUpdateAt).getTime();
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [applications, searchQuery, statusFilter, sortField, sortDirection]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg bg-card">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No job applications yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your applications will appear here once you start receiving emails from job applications
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead 
              className="text-muted-foreground font-mono text-xs uppercase tracking-wider cursor-pointer group/sort"
              onClick={() => handleSort("company")}
            >
              <span className="flex items-center">
                Company <SortIcon field="company" />
              </span>
            </TableHead>
            <TableHead 
              className="text-muted-foreground font-mono text-xs uppercase tracking-wider max-w-[320px] w-[320px] cursor-pointer group/sort"
              onClick={() => handleSort("position")}
            >
              <span className="flex items-center">
                Position <SortIcon field="position" />
              </span>
            </TableHead>
            <TableHead 
              className="text-muted-foreground font-mono text-xs uppercase tracking-wider cursor-pointer group/sort"
              onClick={() => handleSort("status")}
            >
              <span className="flex items-center">
                Status <SortIcon field="status" />
              </span>
            </TableHead>
            <TableHead 
              className="text-muted-foreground font-mono text-xs uppercase tracking-wider cursor-pointer group/sort"
              onClick={() => handleSort("appliedDate")}
            >
              <span className="flex items-center">
                Applied <SortIcon field="appliedDate" />
              </span>
            </TableHead>
            <TableHead 
              className="text-muted-foreground font-mono text-xs uppercase tracking-wider text-right cursor-pointer group/sort"
              onClick={() => handleSort("lastUpdate")}
            >
              <span className="flex items-center justify-end">
                Last Update <SortIcon field="lastUpdate" />
              </span>
            </TableHead>
            <TableHead className="w-8">
              <span className="sr-only">Navigate</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredApplications.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground font-mono">
                No applications match your filters
              </TableCell>
            </TableRow>
          ) : (
            filteredApplications.map((app) => (
              <TableRow
                key={app.id}
                className="cursor-pointer border-border group transition-colors hover:bg-muted/50"
                onClick={() => navigate({ to: "/applications/$id", params: { id: app.id } })}
              >
                <TableCell className="font-medium text-foreground">
                  {app.company ?? <span className="italic text-muted-foreground/50">Unknown company</span>}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-[320px] truncate">
                  {app.position ?? <span className="italic text-muted-foreground/50">Unknown position</span>}
                </TableCell>
                <TableCell>
                  <StatusBadge status={app.currentStatus} />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm font-mono">
                  {formatDate(app.appliedAt)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm font-mono text-right">
                  <span title={formatDate(app.lastUpdateAt)}>
                    {formatRelative(app.lastUpdateAt)}
                  </span>
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
  );
}
