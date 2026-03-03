import { firebaseConfig } from "./firebase-init.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("surveyForm");
const consent = document.getElementById("consent");
const submitBtn = document.getElementById("submitBtn");
const doneBox = document.getElementById("doneBox");
const newBtn = document.getElementById("newBtn");

const codeInput = document.getElementById("participant_code");
const genBtn = document.getElementById("genCodeBtn");

const oiSection = document.getElementById("oiSection");
const cmSection = document.getElementById("cmSection");

function genCode(){
  // كود شديد التميّز: R + YYYYMMDDHHmmss + milliseconds(3) + random(2)
  const d = new Date();
  const pad2 = (n)=> String(n).padStart(2,"0");
  const pad3 = (n)=> String(n).padStart(3,"0");

  const ts =
    d.getFullYear() +
    pad2(d.getMonth()+1) +
    pad2(d.getDate()) +
    pad2(d.getHours()) +
    pad2(d.getMinutes()) +
    pad2(d.getSeconds()) +
    pad3(d.getMilliseconds()); // 000-999

  const rnd = Math.floor(Math.random() * 100); // 00-99
  return `R${ts}${pad2(rnd)}`; // مثال: R2026030410185598712
}

// ===== البنود كما في ملف الاستبيان =====
const OI_BLOCKS = [
  {
    title: "بُعد الحدس الإداري",
    items: [
"أعتمد على خبرتي السابقة في تقييم المواقف الطارئة بسرعة.",
"لدي قدرة على التنبؤ بتطورات الأزمة اعتمادًا على الحدس.",
"أستشعر التغيرات في بيئة العمل عند بداية الأزمة.",
"أستطيع تمييز مستوى خطورة الموقف بمجرد حدوثه.",
"يساعدني حدسي في اختيار الحل الأنسب أثناء الأزمة."
]
  },
  {
    title: "بُعد بناء الحل",
    items: [
"امتلك القدرة على تطوير حلول بديلة عند تعطل الإجراءات التقليدية.",
"أستطيع تعديل الإجراءات التشغيلية بما ينسجم مع الوضع الطارئ.",
"أستخدم الموارد المتاحة بطرق مناسبة لمعالجة الأزمة.",
"أساهم في بناء حلول فورية تضمن استمرار العمل أثناء الأزمة.",
"أجد بدائل سريعة وفعالة عند تعطل أحد عناصر النظام التشغيلي."
]
  },
  {
    title: "بُعد الإبداع والابتكار",
    items: [
"أبتكر أساليب جديدة لمعالجة المشكلات خلال الأزمات.",
"أستخدم أساليب غير تقليدية لتحسين الاستجابة للأزمة.",
"أساهم في تحسين الأداء من خلال طرح أفكار جديدة.",
"أستطيع تعديل أدوات العمل بما يتناسب مع الظروف الطارئة.",
"أساهم في تطوير حلول مبتكرة لضمان سلامة سير الحركة الجوية."
]
  },
  {
    title: "بُعد العفوية",
    items: [
"أستطيع اتخاذ إجراءات فورية عند حدوث ظرف طارئ.",
"لدي مقدرة للاستجابة السريعة للمواقف المفاجئة دون تردد.",
"أتفاعل مباشرة مع أي خلل تشغيلي دون انتظار تعلىمات.",
"أستطيع تغيير طريقة عملي تلقائيًا بما يناسب مع الموقف الطارئ.",
"امتلك قدرة لتأدية عملي بكفاءة حتى تحت ضغط الوقت."
]
  },
  {
    title: "بُعد إدراك المخاطر",
    items: [
"أستطيع تحديد المخاطر المحتملة فور بدء الأزمة.",
"يمكنني تقييم مستوى خطورة الأحداث أثناء تطور الأزمة.",
"بأماكني تحديد الإجراءات الوقائية المناسبة لتقليل المخاطر.",
"أستطيع الموازنة بين سرعة اتخاذ القرار وتقليل المخاطر التشغيلية",
"أستطيع تقييم مدى تأثير المخاطر على سير العمل."
]
  }
];

const CM_BLOCKS = [
  {
    title: "مرحلة ما قبل الأزمة",
    items: [
"تتوفر خطط واضحة لإدارة الأزمات الجوية.",
"يتم تدريب العاملين على سيناريوهات الطوارئ بشكل دوري.",
"يتم تحديث خطط إدارة الأزمات بانتظام.",
"تتوفر قنوات اتصال واضحة للطوارئ في موقع العمل.",
"توجد خطة بديلة في حال تعطل أحد الأنظمة التشغيلية."
]
  },
  {
    title: "مرحلة أثناء الأزمة",
    items: [
"يتم اتخاذ القرارات بسرعة أثناء الأزمة.",
"يتم توزيع المهام بوضوح بين العاملين خلال الأزمة.",
"يعمل التنسيق بين الأبراج ومركز ACC بكفاءة.",
"يتم التعامل مع الأعطال الفنية بسرعة وكفاءة.",
"يتم الاستجابة للمواقف المفاجئة بمرونة وفعالية."
]
  },
  {
    title: "مرحلة ما بعد الأزمة",
    items: [
"يتم تقييم الأداء بعد انتهاء الأزمة بشكل رسمي.",
"تُعتمد الدروس المستفادة لتطوير خطط مستقبلية.",
"يتم إصلاح الأعطال الفنية الناتجة عن حدوث الأزمة.",
"تُراجع الإجراءات التشغيلية لتحسينها.",
"يتم تعزيز جاهزية المؤسسة لمنع تكرار الأخطاء."
]
  }
];

function createLikertItem(name, idx, text){
  const wrap = document.createElement("div");
  wrap.className = "item";
  wrap.innerHTML = `
    <div class="itemTitle">
      <span class="badge">${idx}</span>
      <div>${text}</div>
    </div>
    <div class="scale" role="radiogroup" aria-label="${name}">
      ${[1,2,3,4,5].map(v => `
        <label>
          <input type="radio" name="${name}" value="${v}" required />
          ${v}
        </label>
      `).join("")}
    </div>
  `;
  return wrap;
}

function renderBlocks(target, blocks, prefix){
  let idx = 0;
  blocks.forEach((b)=>{
    const block = document.createElement("div");
    block.className = "block";
    block.innerHTML = `<h3>${b.title}</h3>`;
    b.items.forEach((txt)=>{
      idx += 1;
      block.appendChild(createLikertItem(`${prefix}${idx}`, idx, txt));
    });
    target.appendChild(block);
  });
  return idx;
}

// Render OI1..OI25 and CM1..CM15
renderBlocks(oiSection, OI_BLOCKS, "OI");
renderBlocks(cmSection, CM_BLOCKS, "CM");

function collect(prefix, count){
  const out = {};
  for (let i=1;i<=count;i++){
    const el = form.querySelector(`input[name="${prefix}${i}"]:checked`);
    out[`${prefix}${i}`] = el ? Number(el.value) : null;
  }
  return out;
}

form.addEventListener("submit", async (e)=>{
  e.preventDefault();

  if (!consent.checked){
    alert("يرجى الموافقة على المشاركة أولًا.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "جارٍ الإرسال...";

  try{
    // يقبل القديم R + 14 رقم (ثواني فقط) أو الجديد R + 19 رقم + 2 رقم
const okOld = /^R\d{14}$/.test(code);
const okNew = /^R\d{21}$/.test(code);

if (!okOld && !okNew){
  alert("صيغة الكود غير صحيحة. استخدم زر توليد كود.");
  return;
}

    const payload = {
      participant_code: code,
      gender: document.getElementById("gender").value || "",
      job_title: document.getElementById("job_title").value || "",
      experience: document.getElementById("experience").value || "",
      location: document.getElementById("location").value || "",
      notes: document.getElementById("notes").value || "",
      submitted_at: serverTimestamp(),
      answers: {
        ...collect("OI", 25),
        ...collect("CM", 15)
      }
    };

    // منع الإدخال المكرر يعتمد على Firestore Rules (create only)
    await setDoc(doc(db, "responses", code), payload);

    form.classList.add("hidden");
    doneBox.classList.remove("hidden");
  }catch(err){
    console.error(err);
    alert("تعذر الإرسال. غالبًا الكود مستخدم مسبقًا. اضغط توليد كود جديد ثم أعد الإرسال.");
  }finally{
    submitBtn.disabled = false;
    submitBtn.textContent = "إرسال الاستبانة";
  }
});

newBtn.addEventListener("click", ()=> location.reload());
