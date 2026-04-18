import React, { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button, Card, Input } from "../ui";
import { clientComments } from "../../lib/client-api";
import { Comment } from "../../types";
import { formatDate } from "../../lib/utils";

type Props =
  | { taskId: number; ticketId?: never }
  | { ticketId: number; taskId?: never };

export function CommentsPanel(props: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data =
        "taskId" in props
          ? await clientComments.getByTask(props.taskId, { id: 1, name: 'Admin', email: 'admin@axisogreen.in', role: 'admin', created_at: new Date().toISOString() })
          : await clientComments.getByTicket(props.ticketId, { id: 1, name: 'Admin', email: 'admin@axisogreen.in', role: 'admin', created_at: new Date().toISOString() });
      setComments(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [("taskId" in props ? props.taskId : props.ticketId)]);

  const submit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const commentData = {
        content: content.trim(),
        ...("taskId" in props ? { task_id: props.taskId } : { ticket_id: props.ticketId })
      };
      await clientComments.create(commentData, { id: 1, name: 'Admin', email: 'admin@axisogreen.in', role: 'admin', created_at: new Date().toISOString() });
      setContent("");
      load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-indigo-600" />
          <div className="font-semibold text-gray-900">Comments</div>
        </div>
        <div className="text-xs text-gray-500">{comments.length}</div>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <Button onClick={submit} disabled={submitting || !content.trim()}>
          Post
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading comments…</div>
      ) : comments.length === 0 ? (
        <div className="text-sm text-gray-500">No comments yet.</div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">
                  {c.user_name || `User ${c.user_id}`}
                </div>
                <div className="text-xs text-gray-500">{formatDate(c.created_at)}</div>
              </div>
              <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                {c.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

