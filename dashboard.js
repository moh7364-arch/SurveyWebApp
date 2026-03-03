import { firebaseConfig } from "./firebase-init.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const email = document.getElementById("email");
const pass = document.getElementById("pass");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const statsCard = document.getElementById("statsCard");
const statsBody = document.getElementById("statsBody");

const kpiN = document.getElementById("kpiN");
const kpiOI = document.getElementById("kpiOI");
const kpiCM = document.getElementById("kpiCM");
const kpiUpdated = document.getElementById("kpiUpdated");

let meansChart, locChart, genderChart, countLocChart;

function mean(arr){
  if (!arr.length) return null;
  return arr.reduce((a,b)=>a+b,0)/arr.length;
}
function sdPop(arr){
  if (!arr.length) return null;
  const m = mean(arr);
  const v = arr.reduce((s,x)=> s + Math.pow(x-m,2), 0)/arr.length;
  return Math.sqrt(v);
}
function fmt(x){
  if (x === null || x === undefined || Number.isNaN(x)) return "—";
  return Number(x).toFixed(3);
}
function valuesForKeys(doc, keys){
  const out = [];
  keys.forEach(k=>{
    const v = Number(doc?.answers?.[k]);
    if (!Number.isNaN(v) && v>=1 && v<=5) out.push(v);
  });
  return out;
}

const SUBSCALES = [
  { key:"intuition", label:"الحدس الإداري", keys:["OI1","OI2","OI3","OI4","OI5"] },
  { key:"solution", label:"بناء الحل", keys:["OI6","OI7","OI8","OI9","OI10"] },
  { key:"creativity", label:"الإبداع والابتكار", keys:["OI11","OI12","OI13","OI14","OI15"] },
  { key:"spontaneity", label:"العفوية", keys:["OI16","OI17","OI18","OI19","OI20"] },
  { key:"risk", label:"إدراك المخاطر", keys:["OI21","OI22","OI23","OI24","OI25"] },
  { key:"pre", label:"ما قبل الأزمة", keys:["CM1","CM2","CM3","CM4","CM5"] },
  { key:"during", label:"أثناء الأزمة", keys:["CM6","CM7","CM8","CM9","CM10"] },
  { key:"post", label:"ما بعد الأزمة", keys:["CM11","CM12","CM13","CM14","CM15"] },
];

function destroyIfExists(ch){ if (ch) ch.destroy(); }

function renderCharts(statsRows, locationCompare, genderCompare, locationCounts){
  destroyIfExists(meansChart);
  meansChart = new Chart(document.getElementById("meansChart"), {
    type: "bar",
    data: {
      labels: statsRows.map(r=>r.label),
      datasets: [{ label: "Mean", data: statsRows.map(r=> (r.mean ?? 0)) }]
    },
    options: {
      responsive: true,
      scales: { y: { min: 1, max: 5, ticks: { stepSize: 1 } } }
    }
  });

  destroyIfExists(locChart);
  locChart = new Chart(document.getElementById("locChart"), {
    type: "bar",
    data: {
      labels: ["مطار بنينا","مطار طبرق","مطار الأبرق","مركز ACC"],
      datasets: [{ label: "Mean إدارة الأزمات", data: [
        locationCompare.benina.mean ?? 0,
        locationCompare.tobruk.mean ?? 0,
        locationCompare.alabraq.mean ?? 0,
        locationCompare.acc.mean ?? 0,
      ]}]
    },
    options: {
      responsive: true,
      scales: { y: { min: 1, max: 5, ticks: { stepSize: 1 } } }
    }
  });

  destroyIfExists(genderChart);
  genderChart = new Chart(document.getElementById("genderChart"), {
    type: "bar",
    data: {
      labels: ["ذكور","إناث"],
      datasets: [{ label: "Mean الحدس الإداري", data: [
        genderCompare.male.mean ?? 0,
        genderCompare.female.mean ?? 0,
      ]}]
    },
    options: {
      responsive: true,
      scales: { y: { min: 1, max: 5, ticks: { stepSize: 1 } } }
    }
  });

  destroyIfExists(countLocChart);
  countLocChart = new Chart(document.getElementById("countLocChart"), {
    type: "doughnut",
    data: {
      labels: ["بنينا","طبرق","الأبرق","ACC","غير محدد"],
      datasets: [{ label: "Count", data: [
        locationCounts["1"] || 0,
        locationCounts["2"] || 0,
        locationCounts["3"] || 0,
        locationCounts["4"] || 0,
        locationCounts[""] || 0,
      ]}]
    },
    options: { responsive: true }
  });
}

async function loadDashboard(){
  const snap = await getDocs(collection(db, "responses"));
  const docs = snap.docs.map(d=>d.data());

  kpiN.textContent = String(docs.length);
  kpiUpdated.textContent = new Date().toLocaleString("ar");

  statsBody.innerHTML = "";

  const statsRows = SUBSCALES.map(sc=>{
    const all = [];
    docs.forEach(doc=> all.push(...valuesForKeys(doc, sc.keys)));
    return { label: sc.label, mean: mean(all), sd: sdPop(all), n: all.length };
  });

  statsRows.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.label}</td>
      <td>${fmt(r.mean)}</td>
      <td>${fmt(r.sd)}</td>
      <td>${r.n}</td>
    `;
    statsBody.appendChild(tr);
  });

  // KPI overall means
  const oiKeys = Array.from({length:25}, (_,i)=>`OI${i+1}`);
  const cmKeys = Array.from({length:15}, (_,i)=>`CM${i+1}`);

  const allOI = [];
  const allCM = [];
  docs.forEach(d=>{
    allOI.push(...valuesForKeys(d, oiKeys));
    allCM.push(...valuesForKeys(d, cmKeys));
  });

  kpiOI.textContent = fmt(mean(allOI));
  kpiCM.textContent = fmt(mean(allCM));

  // Location comparison on crisis mean
  const crisisKeys = cmKeys;
  function locAgg(locVal){
    const arr = [];
    docs.forEach(d=>{
      if (String(d.location) === String(locVal)) arr.push(...valuesForKeys(d, crisisKeys));
    });
    return { mean: mean(arr), sd: sdPop(arr), n: arr.length };
  }
  const locationCompare = {
    benina: locAgg(1),
    tobruk: locAgg(2),
    alabraq: locAgg(3),
    acc: locAgg(4),
  };

  // Gender comparison on intuition
  const intKeys = ["OI1","OI2","OI3","OI4","OI5"];
  const maleArr = [];
  const femaleArr = [];
  docs.forEach(d=>{
    const vals = valuesForKeys(d, intKeys);
    if (String(d.gender) === "1") maleArr.push(...vals);
    if (String(d.gender) === "2") femaleArr.push(...vals);
  });
  const genderCompare = {
    male: { mean: mean(maleArr), sd: sdPop(maleArr), n: maleArr.length },
    female: { mean: mean(femaleArr), sd: sdPop(femaleArr), n: femaleArr.length },
  };

  // Counts by location
  const locationCounts = {"":0,"1":0,"2":0,"3":0,"4":0};
  docs.forEach(d=>{
    const k = String(d.location ?? "");
    if (locationCounts[k] === undefined) locationCounts[k] = 0;
    locationCounts[k] += 1;
  });

  renderCharts(statsRows, locationCompare, genderCompare, locationCounts);
  statsCard.classList.remove("hidden");
}

loginBtn.addEventListener("click", async ()=>{
  await signInWithEmailAndPassword(auth, email.value.trim(), pass.value);
});

logoutBtn.addEventListener("click", async ()=>{
  await signOut(auth);
  statsCard.classList.add("hidden");
});

onAuthStateChanged(auth, (user)=>{
  if (user){
    loadDashboard().catch(err=>{
      console.error(err);
      alert("تعذر تحميل لوحة التحكم. تأكد من قواعد Firestore ومن وجود بيانات.");
    });
  }
});
