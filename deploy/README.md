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

### الخطوة 8 — التحقق

افتح في المتصفح:
- ✅ `https://mops.mmit.sa/` — الواجهة الرئيسية (React)
- ✅ `https://mops.mmit.sa/api/health` — حالة الـ API
- ✅ `https://mops.mmit.sa/store` — واجهة المتجر (Next.js)

---

## النشر التالي (تحديث الكود)

بعد أول إعداد، كل تحديث لاحق:

```powershell
# جهازك المحلي
pwsh -File deploy\build.ps1

# انسخ artifacts\ للسيرفر

# السيرفر (كـ Administrator)
pwsh -File deploy\deploy.ps1
```

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

## Rollback (التراجع عن نشر)

قبل كل نشر ننصح بأخذ backup:

```powershell
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item C:\inetpub\mpos "C:\inetpub\mpos-backup-$ts" -Recurse
```

للتراجع:
```powershell
Stop-Service mpos-storefront
Stop-WebAppPool mpos-api
Stop-Website mpos
Remove-Item C:\inetpub\mpos -Recurse -Force
Rename-Item "C:\inetpub\mpos-backup-$ts" C:\inetpub\mpos
Start-WebAppPool mpos-api
Start-Website mpos
Start-Service mpos-storefront
```

---

## ملاحظات مهمة

- **secrets في `appsettings.Production.json` على السيرفر** — لا ترفعها للـ git.
  سكريبت `deploy.ps1` يستخدم `robocopy /MIR` **مع استثناء** هذا الملف حتى لا يُستبدل في كل نشر.

- **متغيرات بيئة للـ Storefront**: إذا احتجت متغيرات للـ Next.js، ضع ملف `.env.production` داخل `C:\inetpub\mpos\storefront\` — السكريبت يستثنيه من النسخ المتكرر.

- **الـ Backend يعمل in-process**: أسرع أداء، لكن إعادة تشغيل الـ app pool تنهي كل الطلبات الجارية. `startMode=AlwaysRunning` يضمن أن التطبيق لا ينام.

- **ARR و Node مطلوبان فقط للـ Storefront**. إذا قررت لاحقاً حذف الـ storefront، تستطيع تعطيل ARR و إزالة خدمة Node لتبسيط السيرفر.
