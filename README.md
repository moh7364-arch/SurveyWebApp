# SurveyWebApp — Firebase + GitHub Pages (نسخة نهائية)

## الملفات
- index.html : صفحة الاستبانة (40 بندًا كما في ملف Word)
- app.js : منطق الاستبانة + كود زمني مرتب + إرسال إلى Firestore
- dashboard.html : لوحة الباحث (محميّة بتسجيل الدخول)
- dashboard.js : Mean/SD + مقارنات + رسوم بيانية (Chart.js)
- firebase-init.js : إعدادات مشروع Firebase
- styles.css : تصميم رسمي
- RULES.md : قواعد Firestore

## إعداد Firebase (مرة واحدة)
1) Firestore Database: Create database (Production mode)
2) Authentication: فعّل Email/Password وأنشئ مستخدمًا للباحث
3) Firestore Rules: الصق محتوى RULES.md ثم Publish

## نشر GitHub Pages
- ارفع الملفات إلى المستودع
- Settings → Pages → Deploy from branch → main → /(root)

## الروابط
- الاستبانة: https://USERNAME.github.io/REPO/
- لوحة الباحث: https://USERNAME.github.io/REPO/dashboard.html

## ملاحظة عن الكود
زر "توليد كود" يولّد: RYYYYMMDDHHmmss (مثال: R20260304145502)
