import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function JobApplicationsTable() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    company: "",
    position: "",
    status: "",
  });
  
  const { data: applications, isLoading } = useQuery(trpc.jobTracking.getApplications.queryOptions());

  // Filter applications based on individual column filters
  const filteredApplications = applications?.filter((app) => {
    const companyMatch = !filters.company || 
      app.company.toLowerCase().includes(filters.company.toLowerCase());
    const positionMatch = !filters.position || 
      app.position.toLowerCase().includes(filters.position.toLowerCase());
    const statusMatch = !filters.status || 
      app.currentStatus.toLowerCase().includes(filters.status.toLowerCase());
    
    return companyMatch && positionMatch && statusMatch;
  });

  const hasActiveFilters = filters.company || filters.position || filters.status;

  const clearFilters = () => {
    setFilters({ company: "", position: "", status: "" });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full mt-2" />
          <Skeleton className="h-12 w-full mt-2" />
          <Skeleton className="h-12 w-full mt-2" />
        </div>
      </div>
    );
  }

  if (!applications || applications.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg bg-card">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="h-10 w-10 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No job applications yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your applications will appear here once you start receiving emails from job applications
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Filter by company..."
            value={filters.company}
            onChange={(e) => setFilters({ ...filters, company: e.target.value })}
            className="pl-9 h-9 text-sm bg-card border-border"
          />
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Filter by position..."
            value={filters.position}
            onChange={(e) => setFilters({ ...filters, position: e.target.value })}
            className="pl-9 h-9 text-sm bg-card border-border"
          />
        </div>
        <div className="relative flex-1 min-w-[150px] max-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Filter by status..."
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="pl-9 h-9 text-sm bg-card border-border"
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
            <X className="h-4 w-4 mr-1.5" />
            Clear
          </Button>
        )}
        <div className="ml-auto text-sm text-muted-foreground">
          {filteredApplications?.length || 0} applications
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">Company</TableHead>
              <TableHead className="text-muted-foreground font-medium">Position</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium">Applied</TableHead>
              <TableHead className="text-muted-foreground font-medium">Last Update</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Navigate</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications?.map((app) => (
              <TableRow
                key={app.id}
                className="cursor-pointer border-border transition-colors hover:bg-secondary/50"
                onClick={() => navigate({ to: "/applications/$id", params: { id: app.id } })}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate({ to: "/applications/$id", params: { id: app.id } });
                  }
                }}
              >
                <TableCell className="font-medium text-foreground">
                  {app.company}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {app.position}
                </TableCell>
                <TableCell>
                  <StatusBadge status={app.currentStatus} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(app.appliedAt)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(app.lastUpdateAt)}
                </TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
            {filteredApplications?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground/40" />
                    <p>No applications match your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
