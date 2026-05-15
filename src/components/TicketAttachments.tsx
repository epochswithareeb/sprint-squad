import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Upload, Trash2, Download } from 'lucide-react';
import {
  useTicketAttachments,
  useUploadAttachment,
  useDeleteAttachment,
} from '@/hooks/useTicketAttachments';
import { useAuth } from '@/contexts/AuthContext';

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  ticketId: string;
}

export function TicketAttachments({ ticketId }: Props) {
  const { isAdmin, user } = useAuth();
  const { data: attachments = [] } = useTicketAttachments(ticketId);
  const upload = useUploadAttachment();
  const remove = useDeleteAttachment();
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = () => inputRef.current?.click();
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    upload.mutate({ ticket_id: ticketId, file, user_id: user.id });
    e.target.value = '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Attachments ({attachments.length})
        </h4>
        {isAdmin && (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleFile}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handlePick}
              disabled={upload.isPending}
            >
              <Upload className="h-3 w-3 mr-1" />
              {upload.isPending ? 'Uploading...' : 'Add Attachment'}
            </Button>
          </>
        )}
      </div>
      {attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No attachments.</p>
      ) : (
        <div className="space-y-2">
          {attachments.map(a => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 p-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{a.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(a.size)} · {new Date(a.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button asChild size="icon" variant="ghost">
                  <a href={a.url} target="_blank" rel="noreferrer" download={a.file_name}>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                {isAdmin && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      remove.mutate({ id: a.id, file_path: a.file_path, ticket_id: ticketId })
                    }
                    disabled={remove.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}