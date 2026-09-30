import { useMutation } from "@tanstack/react-query";
import { Download, FileJson, FileSpreadsheet, FlaskConical, Upload } from "lucide-react";
import { useRef } from "react";
import { notify } from "./notifications";
import { Button, Card } from "./ui";

export type QuestionBankTransferPayload = {
  schemaVersion: "1.0";
  bankType: "exam" | "quiz";
  questions: unknown[];
};

type TransferFormat = "json" | "xlsx";

export function QuestionBankDataTransfer<T extends QuestionBankTransferPayload>({
  bankType,
  canManage = true,
  load,
  readWorkbook,
  writeWorkbook,
  onImport,
  onImported,
}: {
  bankType: "exam" | "quiz";
  canManage?: boolean;
  load: (kind: "export" | "template") => Promise<T>;
  readWorkbook: (file: File, bankType: "exam" | "quiz") => Promise<T>;
  writeWorkbook: (data: T, filename: string) => Promise<void>;
  onImport: (data: T) => Promise<{ created: number }>;
  onImported: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const label = bankType === "exam" ? "بانک سؤال آزمون" : "بانک سؤال آزمونک";
  const download = useMutation({
    mutationFn: async ({
      kind,
      format,
    }: {
      kind: "export" | "template";
      format: TransferFormat;
    }) => {
      const data = await load(kind);
      const filename = `moshaver-${bankType}-question-bank-${kind}.${format}`;
      if (format === "json") downloadJson(data, filename);
      else await writeWorkbook(data, filename);
    },
    onSuccess: () => notify("فایل آماده دانلود شد."),
    onError: (error) =>
      notify(error instanceof Error ? error.message : "دریافت فایل ناموفق بود.", "error"),
  });
  const upload = useMutation({
    mutationFn: onImport,
    onSuccess: (result) => {
      onImported();
      notify(`${result.created.toLocaleString("fa-IR")} سؤال به ${label} افزوده شد.`);
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ورود سؤال‌ها ناموفق بود.", "error"),
  });
  async function selectFile(file?: File) {
    if (!file) return;
    try {
      const data = file.name.toLowerCase().endsWith(".xlsx")
        ? await readWorkbook(file, bankType)
        : (JSON.parse(await file.text()) as T);
      if (!isCompatiblePayload(data, bankType)) {
        throw new Error("ساختار فایل با این بانک سؤال سازگار نیست.");
      }
      upload.mutate(data);
    } catch (error) {
      notify(error instanceof Error ? error.message : "فایل JSON یا Excel معتبر نیست.", "error");
    } finally {
      if (input.current) input.current.value = "";
    }
  }
  const get = (kind: "export" | "template", format: TransferFormat) => () =>
    download.mutate({ kind, format });
  return (
    <Card className="grid gap-3 p-3">
      <div>
        <h2 className="text-sm font-black">ورود و خروجی {label}</h2>
        <p className="text-xs leading-5 text-slate-500">
          قالب را برای شروع دانلود کنید، نمونه آن را ببینید و پس از تکمیل، همان فایل را وارد کنید.
          هر ردیف باید چهار گزینه یکتا و پاسخ صحیح داشته باشد.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="soft"
          loading={download.isPending}
          onClick={get("export", "xlsx")}
        >
          <Download size={15} />
          خروجی Excel
        </Button>
        <Button
          size="sm"
          variant="ghost"
          loading={download.isPending}
          onClick={get("export", "json")}
        >
          <FileJson size={15} />
          خروجی JSON
        </Button>
        <Button
          size="sm"
          variant="soft"
          loading={download.isPending}
          onClick={get("template", "xlsx")}
        >
          <FileSpreadsheet size={15} />
          قالب Excel
        </Button>
        <Button
          size="sm"
          variant="ghost"
          loading={download.isPending}
          onClick={get("template", "json")}
        >
          <FlaskConical size={15} />
          نمونه JSON
        </Button>
        {canManage ? (
          <>
            <input
              ref={input}
              className="sr-only"
              type="file"
              accept=".json,.xlsx,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => void selectFile(event.target.files?.[0])}
            />
            <Button size="sm" loading={upload.isPending} onClick={() => input.current?.click()}>
              <Upload size={15} />
              ورود JSON یا Excel
            </Button>
          </>
        ) : null}
      </div>
    </Card>
  );
}

function isCompatiblePayload(
  value: unknown,
  bankType: "exam" | "quiz",
): value is QuestionBankTransferPayload {
  return (
    !!value &&
    typeof value === "object" &&
    (value as QuestionBankTransferPayload).schemaVersion === "1.0" &&
    (value as QuestionBankTransferPayload).bankType === bankType &&
    Array.isArray((value as QuestionBankTransferPayload).questions)
  );
}

function downloadJson(data: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
