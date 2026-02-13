import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Key, Plus, Copy, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

function formatDate(date: string | Date | null) {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ApiKeyManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery(
    trpc.jobTracking.listApiKeys.queryOptions()
  );

  const createKeyMutation = useMutation({
    ...trpc.jobTracking.createApiKey.mutationOptions(),
    onSuccess: (data) => {
      setCreatedKey(data.apiKey);
      setNewKeyName("");
      queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.listApiKeys.queryKey(),
      });
      toast.success("API key created successfully!");
    },
    onError: (error) => {
      toast.error("Failed to create API key: " + error.message);
    },
  });

  const revokeKeyMutation = useMutation({
    ...trpc.jobTracking.revokeApiKey.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.jobTracking.listApiKeys.queryKey(),
      });
      toast.success("API key revoked successfully!");
    },
    onError: (error) => {
      toast.error("Failed to revoke API key: " + error.message);
    },
  });

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }
    createKeyMutation.mutate({ name: newKeyName });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard!");
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setCreatedKey(null);
    setNewKeyName("");
    setShowKey(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage API keys for your n8n webhook integration
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for your n8n webhook integration. This key
                will only be shown once.
              </DialogDescription>
            </DialogHeader>

            {!createdKey ? (
              <>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="key-name">Key Name</Label>
                    <Input
                      id="key-name"
                      placeholder="e.g., n8n-production"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateKey}
                    disabled={createKeyMutation.isPending}
                  >
                    {createKeyMutation.isPending ? "Creating..." : "Create Key"}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <div className="space-y-4 py-4">
                  <div className="rounded-lg border bg-muted p-4">
                    <Label className="text-destructive font-semibold">
                      Copy this key now! It won't be shown again.
                    </Label>
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        type={showKey ? "text" : "password"}
                        value={createdKey}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowKey(!showKey)}
                      >
                        {showKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopyKey(createdKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCloseCreateDialog}>Done</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {apiKeys && apiKeys.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {key.prefix}...
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={key.isActive ? "default" : "secondary"}
                      className={
                        key.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {key.isActive ? "Active" : "Revoked"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(key.lastUsedAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(key.createdAt)}
                  </TableCell>
                  <TableCell>
                    {key.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => revokeKeyMutation.mutate({ keyId: key.id })}
                        disabled={revokeKeyMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg bg-muted/50">
          <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No API keys yet</h3>
          <p className="text-muted-foreground">
            Create an API key to connect your n8n workflow
          </p>
        </div>
      )}

      <div className="rounded-lg border bg-muted/50 p-4">
        <h4 className="font-semibold mb-2">How to use</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Create an API key above</li>
          <li>Copy the key (it won't be shown again!)</li>
          <li>
            In your n8n HTTP Request node, add this header:
            <code className="ml-2 px-2 py-1 bg-muted rounded text-xs font-mono">
              Authorization: Bearer YOUR_API_KEY
            </code>
          </li>
          <li>Set the URL to: <code className="px-2 py-1 bg-muted rounded text-xs font-mono">{import.meta.env.VITE_SERVER_URL}/trpc/jobTracking.receiveEmail</code></li>
        </ol>
      </div>
    </div>
  );
}
