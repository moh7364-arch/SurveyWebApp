# RULES.md — Firestore Rules

ضع القواعد التالية في:
Firebase Console → Firestore Database → Rules → Publish

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /responses/{code} {

      // يسمح بإنشاء وثيقة جديدة فقط إذا لم تكن موجودة (منع الإدخال المكرر باستخدام نفس الكود)
      allow create: if !exists(/databases/$(database)/documents/responses/$(code));

      // القراءة فقط للمستخدم المسجل دخول (لوحة الباحث)
      allow read: if request.auth != null;

      allow update, delete: if false;
    }
  }
}
```
