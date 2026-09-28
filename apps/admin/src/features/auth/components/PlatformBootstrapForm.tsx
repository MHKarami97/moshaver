import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Field, Input } from "../../../shared/ui/ui";
import { bootstrapPlatformAdmin } from "../api/auth.api";
import { useAuth } from "../hooks/useAuth";

export function PlatformBootstrapForm({ onBack }: { onBack: () => void }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirmation: "",
    firstName: "",
    lastName: "",
  });

  const update = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        if (values.password !== values.passwordConfirmation) {
          setError("تکرار رمز عبور با رمز انتخاب‌شده یکسان نیست.");
          return;
        }
        setBusy(true);
        try {
          await bootstrapPlatformAdmin({
            username: values.username.trim(),
            email: values.email.trim(),
            password: values.password,
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
          });
          await auth.login(values.username, values.password);
          navigate("/admin");
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : "ساخت حساب مدیر ناموفق بود.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="rounded-2xl border border-brand/20 bg-brand/5 p-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
        <span className="mb-2 flex items-center gap-2 font-bold text-brand">
          <ShieldCheck size={18} /> راه‌اندازی نخستین مدیر
        </span>
        این تنها ثبت‌نام عمومی مدیر است و فقط تا پیش از ایجاد نخستین مالک پلتفرم فعال می‌ماند. پس از
        ثبت، با همین حساب وارد می‌شوید و مدیران بعدی را از بخش کاربران با سطح دسترسی محدود می‌سازید.
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نام">
          <Input
            autoComplete="given-name"
            required
            value={values.firstName}
            onChange={update("firstName")}
            disabled={busy}
          />
        </Field>
        <Field label="نام خانوادگی">
          <Input
            autoComplete="family-name"
            required
            value={values.lastName}
            onChange={update("lastName")}
            disabled={busy}
          />
        </Field>
      </div>
      <Field label="ایمیل">
        <Input
          dir="ltr"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={update("email")}
          disabled={busy}
        />
      </Field>
      <Field label="نام کاربری">
        <Input
          dir="ltr"
          autoComplete="username"
          pattern="[A-Za-z0-9._-]{3,80}"
          required
          value={values.username}
          onChange={update("username")}
          disabled={busy}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="رمز عبور">
          <div className="relative">
            <Input
              className="pl-11"
              dir="ltr"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={12}
              required
              value={values.password}
              onChange={update("password")}
              disabled={busy}
            />
            <button
              type="button"
              className="absolute inset-y-0 left-0 grid w-11 place-items-center text-slate-500"
              aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>
        <Field label="تکرار رمز عبور">
          <Input
            dir="ltr"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={12}
            required
            value={values.passwordConfirmation}
            onChange={update("passwordConfirmation")}
            disabled={busy}
          />
        </Field>
      </div>
      <p className="text-xs leading-5 text-slate-500">
        رمز عبور باید دست‌کم ۱۲ نویسه باشد. آن را در محل امن نگه دارید؛ این اطلاعات فقط برای ساخت
        نخستین مالک استفاده می‌شود.
      </p>
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rosewood"
        >
          {error}
        </p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button className="h-12" disabled={busy}>
          {busy ? "در حال ساخت حساب…" : "ساخت مدیر و ورود"}
        </Button>
        <Button type="button" variant="soft" className="h-12" disabled={busy} onClick={onBack}>
          بازگشت به ورود
        </Button>
      </div>
    </form>
  );
}
