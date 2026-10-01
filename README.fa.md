<p align="center">
  <img src="docs/assets/moshaver-readme-hero.svg" alt="مشاور v2 — پلتفرم آموزشی نقش‌محور" width="100%" />
</p>

<h1 align="center">مشاور v2</h1>

<p align="center">
  <strong>پلتفرم آموزشی نقش‌محور برای برنامه‌ریزی، یادگیری، ارتباط، ارزیابی، گزارش‌گیری و پشتیبانی از دانش‌آموز.</strong>
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.fa.md"><strong>فارسی</strong></a>
</p>

مشاور v2 یک مونوریپوی محصولی است که پنل عملیات، اپ دانش‌آموز، API نسخه‌دار و بسته‌های اشتراکی را کنار هم نگه می‌دارد. هسته محصول برای تیم‌های آموزشی و مشاوره‌ای ساخته شده است؛ دسترسی هر کاربر بر اساس نقش، قابلیت و محدوده سازمان/دانش‌آموز در سمت سرور اعمال می‌شود.

## نمای محصول

- **صف «نیازمند توجه»:** درخواست بازیابی، مسئله فعالیت، تلاش مجدد آزمون، گفت‌وگوی خوانده‌نشده، خطای همگام‌سازی و حساب غیرفعال را با اولویت، مسئول، سررسید، وضعیت و پیوند مستقیم یک‌جا نمایش می‌دهد.
- **عملیات سازگار در همه صفحه‌ها:** فهرست‌ها و جدول‌های اشتراکی Admin فیلتر، حالت خالی/خطا/تلاش مجدد، انتخاب گروهی و کارت‌های مناسب موبایل را ارائه می‌کنند.
- **جریان پیوسته دانش‌آموز:** زمینه دانش‌آموز فعال میان پرونده، برنامه‌ریز، گزارش‌ها، گفت‌وگو و ارزیابی‌ها حفظ می‌شود.
- **ارزیابی یکپارچه:** آزمون، آزمونک، سؤال، بانک سؤال، ورود/خروج داده، تخصیص و تحلیل عملکرد در یک جریان نقش‌محور قرار دارند.
- **عملیات امن‌تر:** بازیابی پایگاه داده با بررسی پیش از اجرا، راهنمای بازگشت، تاریخچه ممیزی و تشخیص Push بر اساس مرورگر/دستگاه همراه است.

برای یک دمو، از داشبورد Admin وارد «نیازمند توجه» شوید، یک دانش‌آموز را باز کنید و سپس مسیر برنامه‌ریز، گزارش، گفت‌وگو و ارزیابی را دنبال کنید.

## اجزای اصلی

| پروژه | مسئولیت | فناوری اصلی |
| --- | --- | --- |
| [`apps/api/`](apps/api/) | API نسخه‌دار و ریشه ترکیب بک‌اند | NestJS + Fastify + TypeORM |
| [`apps/admin/`](apps/admin/) | پنل عملیاتی نقش‌محور | React + Vite |
| [`apps/student/`](apps/student/) | وب، PWA و اپ بومی دانش‌آموز | React + Vite + Tauri |
| [`student-core/`](student-core/) | دامنه و قراردادهای مستقل از runtime | TypeScript |
| [`packages/api-contract/`](packages/api-contract/) | مرز قرارداد API اشتراکی | TypeScript |
| [`packages/cmb/`](packages/cmb/) | قابلیت‌های قابل‌ترکیب پلتفرم | TypeScript |

## معماری

مدل پذیرفته‌شده، **مونوریپوی محصولی گروه‌بندی‌شده** با **بک‌اند modular monolith** است. وابستگی‌ها از اپلیکیشن به کد محصول، سپس ماژول‌های CMB و در پایان کرنل/قراردادهای عمومی حرکت می‌کنند.

```text
applications → product/domain code → CMB modules → CMB kernel + public contracts
```

- [نقشه معماری](ARCHITECTURE.md)
- [نقشه سامانه](docs/architecture/system-map.md)
- [مرزهای وابستگی](docs/architecture/dependency-boundaries.md)
- [راهنمای اجرای مخزن](docs/operations/repository-runbook.md)

## شروع سریع

### اجرای کامل با Docker

نیازمندی‌ها: Git و Docker Compose.

```bash
git clone https://github.com/Mobin-Karam/moshaver.git
cd moshaver
git checkout develop
docker compose up --build
```

| سرویس | نشانی محلی |
| --- | --- |
| اپ دانش‌آموز | `http://localhost:8080` |
| پنل Admin | `http://localhost:8081` |
| سلامت API | `http://localhost:4000/health` |
| مستندات Swagger | `http://localhost:4000/api/v2/docs` |

برای توقف، از `docker compose down` استفاده کنید. از `--volumes` فقط وقتی استفاده کنید که حذف داده محلی عمدی است.

### توسعه در سطح پروژه

Node.js `>=22.13.0 <23` برای ابزارهای مخزن لازم است.

```bash
npm run bootstrap
npm run workspace:check

npm --prefix apps/api run dev
npm --prefix apps/admin run dev
# یا
npm --prefix apps/student run dev
```

فایل‌های `.env`، کلیدها، tokenها یا داده پایگاه داده را هرگز commit نکنید. برای جزئیات محیط محلی و استقرار، [راهنمای مخزن](docs/operations/repository-runbook.md) را بخوانید.

## کیفیت و امنیت

پیش از pull request، متناسب با تغییر خود این بررسی‌ها را اجرا کنید:

```bash
npm run workspace:check
npm run architecture:check
npm run contracts:check
npm run verify
npm run docs:check
```

امنیت صرفاً یک کنترل ظاهری UI نیست: احراز هویت، قابلیت‌ها، محدوده سازمان/دانش‌آموز، CSRF، اعتبارسنجی و ممیزی باید در سمت سرور حفظ شوند. آسیب‌پذیری را در issue عمومی منتشر نکنید؛ [SECURITY.md](SECURITY.md) روند گزارش مسئولانه را توضیح می‌دهد.

## مشارکت و مستندات

- [راهنمای مشارکت دو‌زبانه](CONTRIBUTING.md)
- [مرکز مستندات](docs/README.md)
- [راهنمای توسعه‌دهنده](docs/operations/developer-handbook.md)
- [ماتریس قابلیت‌های Admin](docs/ADMIN_V2_CAPABILITY_MATRIX.md)

این مخزن در حال حاضر فایل `LICENSE` ندارد. پیش از استفاده مجدد یا مشارکت با شرایط مجوز مشخص، با نگه‌دارنده مخزن هماهنگ کنید.

<p align="center">
  <strong>مشاور v2</strong><br />
  برنامه‌ریزی · یادگیری · ارتباط · سنجش
</p>
