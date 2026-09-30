import { Check, X } from "lucide-react";
import { Button, Badge, Card } from "../../../shared/ui/ui";
import type { RetryRequest } from "../model/exam.types";

export function RetryRequestsPanel({
  requests,
  onReview,
}: {
  requests: RetryRequest[];
  onReview?: (request: RetryRequest, status: "approved" | "rejected") => void;
}) {
  if (!requests.length) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <details open>
        <summary className="cursor-pointer font-bold">
          {requests.length} درخواست تلاش مجدد در انتظار بررسی
        </summary>

        <div className="divide-y rounded-md border bg-white">
          {requests.map((request) => (
            <div key={request.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <strong className="truncate text-sm">{request.examTitle || "آزمون"}</strong>

                  {!onReview && <Badge tone="amber">در انتظار بررسی مشاور</Badge>}
                </div>

                <p className="truncate text-xs text-slate-500">
                  {request.reason || request.message || "بدون توضیح"}
                </p>
              </div>

              {onReview && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    aria-label="تأیید"
                    title="تأیید"
                    onClick={() => onReview(request, "approved")}
                  >
                    <Check size={14} />
                  </Button>

                  <Button
                    size="sm"
                    variant="danger"
                    aria-label="رد"
                    title="رد"
                    onClick={() => onReview(request, "rejected")}
                  >
                    <X size={14} />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </details>
    </Card>
  );
}
