import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Database,
  Download,
  FileCheck2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { Button, Card, Input } from "../../../shared/ui/ui";
// Matches the API default (`MAX_RESTORE_BODY`); production can raise both through
// its deployment configuration, but the default UI must not invite a guaranteed 400.
const MAX_BACKUP_SIZE = 64 * 1024 * 1024;
export function DatabaseBackupPanel({
  file,
  busy,
  downloading,
  setFile,
  onDownload,
  onRestore,
  canBackup = true,
  canRestore = true,
  restoreEnabled = true,
}: {
  file: File | null;
  busy: boolean;
  downloading: boolean;
  setFile: (file: File | null) => void;
  onDownload: () => void;
  onRestore: () => void;
  canBackup?: boolean;
  canRestore?: boolean;
  restoreEnabled?: boolean;
}) {
  const [acknowledged, setAcknowledged] = useState(false),
    [fileError, setFileError] = useState("");
  function choose(next: File | null) {
    setAcknowledged(false);
    if (!next) {
      setFile(null);
      setFileError("");
      return;
    }
    const extension = next.name.toLowerCase().split(".").pop();
    if (!["sqlite", "sqlite3", "db"].includes(extension || "")) {
      setFile(null);
      setFileError("فقط فایل SQLite با پسوند db، sqlite یا sqlite3 پذیرفته می‌شود.");
      return;
    }
    if (next.size > MAX_BACKUP_SIZE) {
      setFile(null);
      setFileError("حجم فایل بازیابی در تنظیمات پیش‌فرض باید کمتر از ۶۴ مگابایت باشد.");
      return;
    }
    setFileError("");
    setFile(next);
  }
  return (
    <Card className="p-5 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.9fr)]">
        <section>
          <div className="mb-3 flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-sky-50 text-sky-700">
              <Database size={20} />
            </span>
            <div>
              <h3 className="font-bold">نسخه پشتیبان پایگاه داده</h3>
              <p className="text-xs text-slate-500">
                پیش از تغییرات مهم یک نسخه سالم و قابل بازگشت دریافت کنید.
              </p>
            </div>
          </div>
          <Button
            loading={downloading}
            disabled={!canBackup || downloading || busy}
            onClick={onDownload}
          >
            <Download size={16} />
            دانلود نسخه جدید
          </Button>
          {!canBackup ? (
            <p className="mt-2 text-xs text-slate-500">
              مجوز تهیه نسخه پشتیبان برای نقش شما فعال نیست.
            </p>
          ) : null}
        </section>
        <section className="rounded-xl border border-rose-200 bg-rose-50/50 p-3">
          <div className="mb-2 flex items-center gap-2 font-bold text-rose-800">
            <AlertTriangle size={17} />
            بازیابی پرخطر
          </div>
          <Input
            aria-label="فایل بازیابی SQLite"
            type="file"
            accept=".sqlite,.sqlite3,.db,application/vnd.sqlite3,application/octet-stream"
            disabled={!canRestore || !restoreEnabled || busy}
            onChange={(event) => choose(event.target.files?.[0] || null)}
          />
          {file ? (
            <div className="mt-2 flex items-center gap-2 rounded-md bg-white p-2 text-xs">
              <FileCheck2 size={16} className="text-emerald-600" />
              <span className="min-w-0 flex-1 truncate" dir="ltr">
                {file.name}
              </span>
              <span>
                {(file.size / 1024 / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} MB
              </span>
            </div>
          ) : null}
          {fileError ? (
            <p className="mt-2 text-xs text-rose-700" role="alert">
              {fileError}
            </p>
          ) : null}
          <div className="mt-3 rounded-lg border border-rose-200/80 bg-white/70 p-3 text-xs text-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
            <p className="mb-2 font-bold text-rose-900 dark:text-rose-200">بررسی پیش از بازیابی</p>
            <PreflightRow
              ready={Boolean(file) && !fileError}
              label="فایل SQLite و حجم آن در مرورگر بررسی شد"
            />
            <PreflightRow ready={canRestore} label="مجوز بازیابی برای نقش فعلی فعال است" />
            <PreflightRow ready={restoreEnabled} label="بازیابی راه‌دور در سرور مجاز است" />
            <PreflightRow ready label="سرور پیش از جایگزینی، snapshot بازگشت ایجاد می‌کند" />
            <PreflightRow
              ready
              label="در خطای راه‌اندازی، snapshot به‌طور خودکار برگردانده می‌شود"
            />
            <PreflightRow ready label="پس از جایگزینی، سلامت SQLite دوباره بررسی می‌شود" />
            <PreflightRow
              ready
              label="نتیجه را از تاریخچه عملیات و سلامت پایگاه داده بررسی می‌کنید"
            />
          </div>
          <label className="mt-3 flex items-start gap-2 text-xs text-slate-700">
            <input
              className="mt-0.5"
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            <span>می‌دانم داده فعلی جایگزین و سرویس برای راه‌اندازی مجدد متوقف می‌شود.</span>
          </label>
          <Button
            className="mt-3 w-full"
            loading={busy}
            variant="danger"
            disabled={
              !canRestore || !restoreEnabled || !file || !acknowledged || busy || downloading
            }
            onClick={onRestore}
          >
            <Upload size={16} />
            اعتبارسنجی و بازیابی
          </Button>
          {!canRestore ? (
            <p className="mt-2 text-xs text-rose-700">نقش شما مجوز بازیابی پایگاه داده را ندارد.</p>
          ) : !restoreEnabled ? (
            <p className="mt-2 text-xs text-rose-700">
              بازیابی راه‌دور در تنظیمات سرور غیرفعال است.
            </p>
          ) : null}
        </section>
      </div>
    </Card>
  );
}

function PreflightRow({ ready, label }: { ready: boolean; label: string }) {
  return (
    <p className={`mt-1 flex items-start gap-2 ${ready ? "" : "text-slate-500"}`}>
      {ready ? (
        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" />
      ) : (
        <Circle size={14} className="mt-0.5 shrink-0" />
      )}
      {label}
    </p>
  );
}
