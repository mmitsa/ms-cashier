# دليل نشر MPOS على Windows Server + IIS

الهدف: نشر المنصة على السيرفر لتكون متاحة على `https://mops.mmit.sa`.

## المعمارية النهائية

```
https://mops.mmit.sa/           → React Frontend (IIS Static Site) — بورت 443
                                   URL Rewrite داخل web.config يحوّل:
                                   /api/*   → http://127.0.0.1:5000/api/*
                                   /store/* → http://127.0.0.1:3000/store/*

Backend:    موقع IIS مستقل على 127.0.0.1:5000 (محلي فقط)
Storefront: خدمة Node (NSSM) على 127.0.0.1:3000 (محلي فقط)
SQL Server: localhost (نفس السيرفر)
SSL:        Let's Encrypt تلقائي عبر win-acme
```

| المكون | المسار | الـ Binding | كيف يعمل |
|--------|-------|-------------|----------|
| Frontend (React) | `C:\inetpub\mpos\frontend` | `mops.mmit.sa:443` | ملفات static + web.config + URL Rewrite |
| Backend (.NET 8) | `C:\inetpub\mpos\backend` | `127.0.0.1:5000` | AspNetCoreModuleV2 in-process |
| Storefront (Next.js) | `C:\inetpub\mpos\storefront` | `127.0.0.1:3000` | Node service via NSSM |

---

## المتطلبات قبل البدء

1. **السيرفر**: Windows Server 2019 أو 2022
2. **DNS**: `mops.mmit.sa` يشير لـ IP العام للسيرفر (A record)
3. **Firewall**: الـ ports 80 و 443 مفتوحة خارجياً
4. **SQL Server**: مثبت على نفس السيرفر (أو متاح عبر connection string)
5. **PowerShell 5.1+** (افتراضي على Windows Server)
6. **Internet access** من السيرفر (لتنزيل dependencies و شهادة SSL)

---

## خطوات النشر (أول مرة)

### الخطوة 1 — البناء على جهازك المحلي

```powershell
# من مسار المشروع على جهازك (Windows أو Mac/Linux مع dotnet + node)
pwsh -File deploy\build.ps1
```

الناتج يظهر في `deploy\artifacts\`:
- `backend\` — المشروع .NET منشور
- `frontend\` — ملفات React static
- `storefront\` — Next.js standalone

### الخطوة 2 — نسخ المشروع للسيرفر

انسخ مجلد `deploy\` بالكامل (مع `artifacts\`) إلى السيرفر، مثلاً إلى:
```
C:\mpos-deploy\
```

أمثلة أدوات النسخ:
- WinSCP / RDP copy
- `robocopy \\server\share\mpos-deploy C:\mpos-deploy /MIR`
- Git على السيرفر + `deploy\build.ps1` هناك مباشرة

### الخطوة 3 — إعداد IIS (مرة واحدة فقط)

افتح PowerShell **كـ Administrator**:

```powershell
cd C:\mpos-deploy
pwsh -File deploy\setup-iis.ps1 -ContactEmail "admin@mmit.sa"
```

هذا السكريبت يقوم بـ:
- تثبيت دور IIS + الميزات المطلوبة
- تثبيت Chocolatey + ASP.NET Core 8 Hosting Bundle + URL Rewrite + ARR + NSSM + Node.js + win-acme
- إنشاء app pool `mpos-api` و IIS site `mpos` على `mops.mmit.sa`
- إنشاء IIS site مستقل `mpos-api` على `127.0.0.1:5000` للـ .NET API
- إعداد صلاحيات الملفات
- فتح الـ firewall (ports 80, 443)
- **إصدار شهادة Let's Encrypt تلقائياً** (المتطلب: DNS يشير للسيرفر + port 80 مفتوح)

> **مهم:** هذه الخطوة تُشغَّل **قبل** إعداد SQL Server، لأن SQL يحتاج هوية
> `IIS APPPOOL\mpos-api` موجودة أولاً عشان يعطيها صلاحيات DB.

### الخطوة 4 — إعداد SQL Server

> **ملاحظة أمان:** لا نستخدم حساب `sa` ولا أي حساب SQL بكلمة مرور.
> نستخدم **Windows Authentication عبر IIS AppPool identity** —
> ده أأمن لأن مفيش كلمة مرور مخزنة في أي ملف على السيرفر.

#### الطريقة الموصى بها — Windows Authentication (تلقائي)

**متطلبات:**
- SQL Server مثبت على **نفس السيرفر**
- أنت تشتغل بحساب ويندوز عنده صلاحية `sysadmin` على SQL Server
  (مثلاً: local Administrator على تنصيب افتراضي، لأن `BUILTIN\Administrators`
  عنده sysadmin في أغلب التنصيبات)
- الخطوة 3 (IIS) خلصت وأنشأت الـ AppPool `mpos-api`

**تشغيل السكريبت (كـ Administrator):**
```powershell
pwsh -File deploy\setup-sqlserver.ps1
```

السكريبت بيعمل:
1. يتأكد أن `sqlcmd` متوفر (يثبته لو مش موجود)
2. ينشئ قاعدة بيانات `MsCashier` لو مش موجودة
3. يشغّل `001-schema.sql` من جذر المشروع
4. ينشئ Windows login في SQL Server للهوية `IIS APPPOOL\mpos-api`
5. يعطيها `db_owner` على قاعدة `MsCashier` (عشان EF migrations تشتغل)

بعدها الـ API يتصل بـ SQL Server باستخدام هوية الـ AppPool بدون أي كلمة مرور —
وبما أن هوية الـ AppPool هي حساب افتراضي مخصص لـ IIS، فمحدش يقدر يستخدمها
من خارج الـ AppPool.

#### الطريقة البديلة — SQL Login (لو SQL على سيرفر بعيد)

لو SQL Server على جهاز تاني و مش تقدر تستخدم Windows Auth:
```powershell
pwsh -File deploy\setup-sqlserver.ps1 `
    -AuthMode SqlLogin `
    -SqlInstance 'db-server.internal' `
    -SqlUser mscashier `
    -SqlPassword 'كلمة_مرور_قوية_جداً'
```
ثم في الخطوة 5 استخدم الـ `__alternative_sql_auth` connection string من الـ template
واحذف `__comment` و `__alternative_sql_auth` منه.

#### تشغيل على SQL Server Named Instance

لو التنصيب Named Instance مثل `SQLEXPRESS`:
```powershell
pwsh -File deploy\setup-sqlserver.ps1 -SqlInstance 'localhost\SQLEXPRESS'
```
و عدّل `Server=localhost\SQLEXPRESS` في الـ connection string.

### الخطوة 5 — إنشاء ملف الإعدادات من الـ template

على السيرفر، انسخ الـ template و املأه بالقيم الفعلية:
```powershell
Copy-Item `
    'C:\mpos-deploy\artifacts\backend\appsettings.Production.json.template' `
    'C:\mpos-deploy\artifacts\backend\appsettings.Production.json'
notepad 'C:\mpos-deploy\artifacts\backend\appsettings.Production.json'
```

عدّل:
- `ConnectionStrings.DefaultConnection` → خليه زي ما هو (Integrated Security)
  لو استخدمت Windows Auth في الخطوة 4. احذف المفاتيح اللي تبدأ بـ `__`.
- `Jwt.Key` → سلسلة عشوائية **64 حرف على الأقل** (استخدم مولد كلمات مرور).
  لتوليد مفتاح قوي في PowerShell:
  ```powershell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
  ```

> **ملاحظة أمان:** `appsettings.Production.json` في `.gitignore` — لن يُرفع للـ git.
> الـ template فقط هو اللي في الـ repo. ده مقصود.

### الخطوة 6 — نشر الملفات

```powershell
pwsh -File deploy\deploy.ps1
```

ينسخ الملفات من `artifacts\` إلى `C:\inetpub\mpos\` ويعيد تشغيل الخدمات.

### الخطوة 7 — تسجيل خدمة الـ Storefront

```powershell
pwsh -File deploy\setup-storefront-service.ps1
```

هذا ينشئ خدمة ويندوز `mpos-storefront` تدير عملية Next.js على `127.0.0.1:3000`.

### الخطوة 8 — التحقق (Smoke Test)

```powershell
pwsh -File deploy\verify.ps1
```

السكريبت بيختبر:
- **حالة الخدمات**: `mpos-storefront` (Windows service) و `mpos` و `mpos-api` (IIS sites)
- **Endpoints داخلية**:
  - `http://127.0.0.1:5000/health` (الباك إند)
  - `http://127.0.0.1:3000/store` (Next.js)
- **Endpoints عامة (عبر HTTPS)**:
  - `https://mops.mmit.sa/` (React)
  - `https://mops.mmit.sa/api/v1/health` (عبر الـ reverse proxy)
  - `https://mops.mmit.sa/store` (عبر ARR)

**Exit code**: `0` = كله تمام، `1` = في فشل (يظهر تفاصيل الفشل).

**قبل جاهزية DNS/SSL** استخدم `-SkipPublic` لاختبار الجزء الداخلي فقط:
```powershell
pwsh -File deploy\verify.ps1 -SkipPublic
```

> ملاحظة: `deploy.ps1` بيشغل `verify.ps1 -SkipPublic` تلقائياً بعد كل نشر.

### الخطوة 9 — تفعيل النسخ الاحتياطي اليومي (backup-db)

```powershell
pwsh -File deploy\backup-db.ps1 -InstallScheduledTask
```

بينشئ مهمة مجدولة `MPOS-Daily-DB-Backup` تعمل كل يوم **الساعة 2:30 صباحاً**
كـ `SYSTEM` (الحساب ده عنده `sysadmin` على SQL Server المحلي تلقائياً —
ومفيش كلمة مرور متخزنة في المهمة).

- **مكان النسخ**: `C:\inetpub\mpos\backups\`
- **الصيغة**: `MsCashier-YYYYMMDD-HHmmss.bak` (native SQL backup + compression)
- **الاحتفاظ**: آخر 14 يوم، القديم يُحذف تلقائياً

**تشغيل يدوي** (اختبار / قبل deploy كبير):
```powershell
pwsh -File deploy\backup-db.ps1
```

**تغيير الاحتفاظ**:
```powershell
pwsh -File deploy\backup-db.ps1 -InstallScheduledTask -RetentionDays 30 -ScheduledTime '03:00'
```

**إلغاء المهمة المجدولة**:
```powershell
pwsh -File deploy\backup-db.ps1 -RemoveScheduledTask
```

**استرجاع نسخة** (في SSMS أو sqlcmd):
```sql
USE master;
RESTORE DATABASE MsCashier
    FROM DISK = N'C:\inetpub\mpos\backups\MsCashier-20260415-023000.bak'
    WITH REPLACE, RECOVERY;
```

---

## النشر التالي (تحديث الكود)

### الطريقة الموصى بها — Release من GitHub Actions

1. على جهازك، اعمل tag:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
2. GitHub Actions يبني الـ 3 مشاريع و ينشر `mpos-v1.0.1.zip` في [Releases](https://github.com/mmitsa/ms-cashier/releases).
3. على السيرفر:
   ```powershell
   pwsh -File deploy\pull-release.ps1
   pwsh -File deploy\deploy.ps1
   ```

`pull-release.ps1` ينزل آخر release، يتحقق من SHA-256، و يفك الضغط إلى `C:\mpos-deploy\artifacts\`.

لاختيار tag معين:
```powershell
pwsh -File deploy\pull-release.ps1 -Tag v1.0.0
```

### الطريقة التلقائية بالكامل — Auto-Deploy (بدون تدخل يدوي)

بعد إعداد الـ webhook مرة واحدة، الفلو يكون:
```
git tag v1.2.0 && git push origin v1.2.0
```
وانتهى! الباقي يحصل تلقائياً:
1. GitHub Actions يبني الـ 3 مشاريع
2. ينشر `mpos-v1.2.0.zip` في Releases
3. يرسل webhook للسيرفر (أو GitHub يرسله تلقائياً عبر release event)
4. السيرفر يشغل `auto-deploy.ps1`:
   - backup الداتابيز ← pull release ← snapshot + deploy ← smoke test

**إعداد الـ Auto-Deploy (مرة واحدة على السيرفر):**

```powershell
# 1. إعداد خدمة الـ webhook
pwsh -File deploy\setup-webhook.ps1

# 2. سجّل الـ secret و الـ URL اللي طلعوا (مهم!)
# 3. اذهب إلى GitHub > الـ repo > Settings > Webhooks > Add webhook:
#      Payload URL:  https://mops.mmit.sa/deploy-webhook/webhook
#      Content type: application/json
#      Secret:       <الـ secret اللي طلع>
#      Events:       ✓ Releases
# 4. أضف في GitHub > Settings > Secrets and variables > Actions:
#      WEBHOOK_URL:    https://mops.mmit.sa/deploy-webhook/deploy
#      WEBHOOK_SECRET: <نفس الـ secret>
```

**كيف يعمل (المعمارية):**
```
                     ┌─────────────────────────────┐
git tag v1.2.0 ───→ │     GitHub Actions           │
                     │  build → release → webhook   │
                     └──────────┬──────────────────┘
                                │ POST /deploy-webhook/webhook
                                ▼
                     ┌─────────────────────────────┐
                     │  IIS (mops.mmit.sa:443)      │
                     │  URL Rewrite → 127.0.0.1:9850│
                     └──────────┬──────────────────┘
                                │
                                ▼
                     ┌─────────────────────────────┐
                     │  webhook-server.js (NSSM)    │
                     │  verify HMAC → auto-deploy   │
                     └──────────┬──────────────────┘
                                │ pwsh auto-deploy.ps1
                                ▼
                     ┌─────────────────────────────┐
                     │  1. backup-db.ps1            │
                     │  2. pull-release.ps1 -Tag    │
                     │  3. deploy.ps1 (+ snapshot)  │
                     │  4. verify.ps1               │
                     └─────────────────────────────┘
```

**مراقبة حالة الـ webhook:**
```powershell
# صحة الخدمة
curl http://127.0.0.1:9850/health

# سجلات
type C:\inetpub\mpos\deploy\webhook\logs\stdout.log
type C:\inetpub\mpos\deploy\webhook\auto-deploy-log.txt
```

**أمان الـ webhook:**
- الـ secret يُستخدم بطريقتين: HMAC-SHA256 (GitHub webhooks) و Bearer token (GitHub Actions)
- الـ webhook listener يسمع على **127.0.0.1 فقط** (مش مكشوف مباشرة على الإنترنت)
- IIS يعمل reverse proxy عبر HTTPS — لا حاجة لفتح port إضافي
- concurrent deploys ممنوعة (الثاني ينتظر)

---

### الطريقة البديلة — بناء محلي

```powershell
# جهازك المحلي
pwsh -File deploy\build.ps1

# انسخ deploy\artifacts\ للسيرفر

# السيرفر (كـ Administrator)
pwsh -File deploy\deploy.ps1
```

---

## Rollback (التراجع بعد deploy فاشل)

كل `deploy.ps1` بيعمل snapshot قبل النشر في `C:\inetpub\mpos-snapshots\<timestamp>\` (آخر 3 snapshots فقط بيتحفظوا).

**عرض الـ snapshots المتاحة**:
```powershell
pwsh -File deploy\rollback.ps1 -List
```

**رجوع لآخر نسخة تلقائياً**:
```powershell
pwsh -File deploy\rollback.ps1
```

**رجوع لـ snapshot معين**:
```powershell
pwsh -File deploy\rollback.ps1 -Snapshot 20260415-143022
```

الـ rollback بيحافظ على `appsettings.Production.json` و `.env.production` الحاليين (مش بيرجعهم لنسخة قديمة).

---

## Log Rotation (تنظيف دوري للـ logs)

ملفات الـ stdout logs بتكبر مع الوقت (خصوصاً `C:\inetpub\mpos\backend\logs\stdout_*.log`). لتفعيل التنظيف التلقائي:

```powershell
pwsh -File deploy\log-rotate.ps1 -InstallScheduledTask
```

- يعمل كل **أحد 03:00 صباحاً** كـ `SYSTEM`
- يحذف ملفات `.log` و `.txt` أقدم من 30 يوم من:
  - `C:\inetpub\mpos\backend\logs\`
  - `C:\inetpub\mpos\storefront\logs\`
  - `C:\inetpub\logs\LogFiles\` (IIS request logs)

**تشغيل يدوي** (اختبار):
```powershell
pwsh -File deploy\log-rotate.ps1
```

**احتفاظ مختلف** (مثلاً 60 يوم):
```powershell
pwsh -File deploy\log-rotate.ps1 -InstallScheduledTask -RetentionDays 60
```

---

## المراقبة الخارجية (Uptime Monitoring)

لاكتشاف عطل السيرفر خارجياً (نضمن أن النت للسيرفر شغال، مش فقط الخدمات داخلياً)، نوصي بخدمة مجانية مثل **UptimeRobot**:

1. أنشئ حساب على [uptimerobot.com](https://uptimerobot.com)
2. أضف 3 monitors (كل واحد نوعه HTTPS):

| Monitor Name | URL | Expected Keyword |
|--------------|-----|------------------|
| MPOS Frontend | `https://mops.mmit.sa/` | `mpos` (أو عنوان الصفحة) |
| MPOS API | `https://mops.mmit.sa/api/v1/health` | (فقط 200 status) |
| MPOS Storefront | `https://mops.mmit.sa/store` | `متجر` (أو أي نص عربي في الصفحة) |

3. إعدادات يوصى بها:
   - **Monitoring Interval**: 5 دقائق
   - **Alert Contacts**: إيميل + SMS (حسب الخطة)
   - **SSL Monitoring**: فعّله لتنبيه قبل انتهاء الشهادة (حتى لو win-acme يُجدد تلقائياً)

4. للـ status page عام (اختياري): UptimeRobot يوفر صفحة مجانية تعرض حالة MPOS لعملائك.

**بدائل مجانية**: BetterStack, Freshping, StatusCake — نفس الفكرة.

---

## التجديد التلقائي لشهادة SSL

`win-acme` يُسجّل مهمة مجدولة (scheduled task) تعمل يومياً وتُجدد الشهادة قبل 30 يوم من انتهائها. لا تحتاج تدخل يدوي.

للتحقق:
```powershell
Get-ScheduledTask | Where-Object TaskName -like 'win-acme*'
```

---

## مراقبة وتشخيص الأخطاء

### سجلات الـ Backend
```
C:\inetpub\mpos\backend\logs\stdout_*.log
```
يعمل stdout logging تلقائياً عبر `web.config`.

### سجلات الـ Storefront
```
C:\inetpub\mpos\storefront\logs\stdout.log
C:\inetpub\mpos\storefront\logs\stderr.log
```

### حالة الخدمات
```powershell
Get-Service mpos-storefront
Get-WebAppPoolState -Name mpos-api
Get-Website -Name mpos
```

### سجل IIS
```
C:\inetpub\logs\LogFiles\W3SVC*\
```

### Event Viewer
```
Windows Logs > Application (مصدر: IIS AspNetCore Module V2)
```

---

## أوامر شائعة

```powershell
# إعادة تشغيل الـ API
Restart-WebAppPool -Name mpos-api

# إعادة تشغيل الـ Storefront
Restart-Service mpos-storefront

# إعادة تشغيل كل IIS
iisreset

# إظهار جميع المواقع
Get-Website
```

---

## ملاحظات مهمة

- **secrets في `appsettings.Production.json` على السيرفر** — لا ترفعها للـ git.
  سكريبت `deploy.ps1` يستخدم `robocopy /MIR` **مع استثناء** هذا الملف حتى لا يُستبدل في كل نشر.

- **متغيرات بيئة للـ Storefront**: إذا احتجت متغيرات للـ Next.js، ضع ملف `.env.production` داخل `C:\inetpub\mpos\storefront\` — السكريبت يستثنيه من النسخ المتكرر.

- **الـ Backend يعمل in-process**: أسرع أداء، لكن إعادة تشغيل الـ app pool تنهي كل الطلبات الجارية. `startMode=AlwaysRunning` يضمن أن التطبيق لا ينام.

- **ARR و Node مطلوبان فقط للـ Storefront**. إذا قررت لاحقاً حذف الـ storefront، تستطيع تعطيل ARR و إزالة خدمة Node لتبسيط السيرفر.
