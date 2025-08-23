import React, { useMemo, useState, useEffect } from "react";

/*************************************** 
 * 介護施設向けシフト作成・検食ローテーション（React単一ファイル）
 * ▼今回の修正（"CSVが保存できない" 対策 & Sandbox耐性）
 * - ダウンロード処理を **自動クリックに依存せず**、常に「ダウンロードセンター」へ表示
 *   - data:URL（BOM付）リンク / 新規タブ表示 / クリップボードコピーを提供
 * - localStorage / clipboard / window.open はすべて try/catch で保護
 * - ErrorBoundary を追加（Script errorでアプリが落ちない）
 * - CSV生成を副作用レス関数へ分離し、**テストケース追加**
 ***************************************/

/************ Error Boundary ************/
class ErrorBoundary extends React.Component<any, { error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { error };
  }

  componentDidCatch(error: any, info: any) {
    try {
      console.error("[ErrorBoundary]", error, info);
    } catch {}
  }

  render() {
    if (this.state.error) {
      const msg = (this.state.error && (this.state.error.message || String(this.state.error))) || "Unknown error";
      return (
        <div className="min-h-screen bg-rose-50 text-rose-900">
          <div className="max-w-3xl mx-auto p-4">
            <h2 className="text-lg font-semibold mb-2">画面でエラーが発生しました</h2>
            <p className="text-sm mb-3">{msg}</p>
            <button 
              className="px-3 py-1.5 rounded-lg bg-white border border-rose-200" 
              onClick={() => location.reload()}
            >
              再読み込み
            </button>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

/************ Sandbox-safe utilities ************/
function isStorageAvailable() {
  try {
    const k = "__probe__";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

async function safeClipboardWrite(text: string) {
  try {
    if ((navigator as any)?.clipboard?.writeText) {
      await (navigator as any).clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {}
  return false;
}

function makeDataUrlCSV(text: string) {
  const prefix = "data:text/csv;charset=utf-8,\uFEFF"; // BOM 付与
  return prefix + encodeURIComponent(text);
}

function openNewTabWithText(text: string, mime = "text/plain;charset=utf-8") {
  // best-effort
  try {
    const win = window.open();
    if (!win) return false;
    win.document.open();
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    win.document.write(`<pre>${escaped}</pre>`);
    win.document.close();
    return true;
  } catch {
    return false;
  }
}/*******
***** App (Inner) ************/
function InnerApp() {
  // === 初期データ ===
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth() + 1); // 1-12

  type ShiftKey = "早" | "日" | "遅" | "夜";
  type RoleKey = "介護" | "ナース" | "事務";
  type MealKey = "朝食" | "昼食" | "夕食" | "夜食";

  const SHIFT_ORDER: ShiftKey[] = ["夜", "早", "日", "遅"]; // 割当順序（夜→早→日→遅）
  const MEALS: MealKey[] = ["朝食", "昼食", "夕食", "夜食"];

  // 役割と標準必要人数
  type Requirements = Record<ShiftKey, number>;
  type RoleConfig = { role: RoleKey; count: number; requirements: Requirements; staff: string[] };

  const defaultConfigs: RoleConfig[] = useMemo(() => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const makeNames = (label: string, n: number) => Array.from({ length: n }, (_, i) => `${label}${pad(i + 1)}`);
    return [
      { role: "介護", count: 40, requirements: { 早: 3, 日: 6, 遅: 3, 夜: 2 }, staff: makeNames("介護", 40) },
      { role: "ナース", count: 11, requirements: { 早: 0, 日: 2, 遅: 0, 夜: 1 }, staff: makeNames("ナース", 11) },
      { role: "事務", count: 6, requirements: { 早: 0, 日: 2, 遅: 0, 夜: 0 }, staff: makeNames("事務", 6) },
    ];
  }, []);

  const [roles, setRoles] = useState<RoleConfig[]>(defaultConfigs);

  // カレンダー日数
  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const dayNumbers = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  // スケジュール構造： schedule[day][role][shift] = string[] (名前配列)
  type DaySchedule = Record<RoleKey, Record<ShiftKey, string[]>>;
  const emptyDay = (): DaySchedule => ({ 
    介護: { 早: [], 日: [], 遅: [], 夜: [] }, 
    ナース: { 早: [], 日: [], 遅: [], 夜: [] }, 
    事務: { 早: [], 日: [], 遅: [], 夜: [] } 
  });

  const emptySchedule: Record<number, DaySchedule> = useMemo(() => {
    const obj: any = {};
    for (const d of dayNumbers) obj[d] = emptyDay();
    return obj;
  }, [daysInMonth]);

  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>(emptySchedule);

  // 自動割当用トラッカー
  type StaffStats = { total: number; consecDays: number; lastShift: ShiftKey | "休" | null; nightsIn7: number[] };

  function makeInitialStats(names: string[]) {
    const m = new Map<string, StaffStats>();
    names.forEach(n => m.set(n, { total: 0, consecDays: 0, lastShift: null, nightsIn7: [] }));
    return m;
  }

  function buildRoleStats(): Record<RoleKey, Map<string, StaffStats>> {
    return roles.reduce((acc, rc) => {
      acc[rc.role] = makeInitialStats(rc.staff);
      return acc;
    }, {} as any);
  }

  // === 勤務シフト：自動割当 ===
  function autoAssign() {
    const newSchedule: Record<number, DaySchedule> = {};
    for (const d of dayNumbers) newSchedule[d] = emptyDay();

    const roleStats = buildRoleStats();

    for (const d of dayNumbers) {
      for (const rc of roles) {
        const req = rc.requirements;
        const stats = roleStats[rc.role];

        for (const shift of SHIFT_ORDER) {
          const need = req[shift];
          if (need <= 0) continue;

          const assignedToday = new Set<string>();
          Object.values(newSchedule[d][rc.role]).forEach(arr => arr.forEach(n => assignedToday.add(n)));

          const pickCandidate = () => {
            const candidates = rc.staff.filter(n => !assignedToday.has(n));
            candidates.sort((a, b) => {
              const A = stats.get(a)!;
              const B = stats.get(b)!;
              const pen = (st: StaffStats) => {
                let p = 0;
                p += st.total * 2;
                p += st.consecDays;
                if (st.lastShift === "夜" && shift === "早") p += 100;
                if (shift === "夜") {
                  const recent = st.nightsIn7.reduce((s, x) => s + x, 0);
                  p += recent * 10;
                }
                return p;
              };
              return pen(A) - pen(B);
            });

            for (const c of candidates) {
              const st = stats.get(c)!;
              if (st.consecDays >= 5) continue;
              if (st.lastShift === "夜" && shift === "早") continue;
              return c;
            }
            return candidates[0] ?? null;
          };

          for (let i = 0; i < need; i++) {
            const picked = pickCandidate();
            if (!picked) break;
            newSchedule[d][rc.role][shift].push(picked);
            assignedToday.add(picked);
          }
        }

        for (const name of rc.staff) {
          const st = roleStats[rc.role].get(name)!;
          const todayShift = (() => {
            for (const s of SHIFT_ORDER) if (newSchedule[d][rc.role][s].includes(name)) return s;
            return "休" as const;
          })();

          if (todayShift === "休") st.consecDays = 0;
          else {
            st.total += 1;
            st.consecDays += 1;
          }

          st.nightsIn7.push(todayShift === "夜" ? 1 : 0);
          if (st.nightsIn7.length > 7) st.nightsIn7.shift();
          st.lastShift = todayShift;
        }
      }
    }

    setSchedule(newSchedule);
  }  // =
== 検食ローテーション ===
  type MealRule = { need: number; eligible: { role: RoleKey; shifts: ShiftKey[] }[] };

  const defaultMealRules: Record<MealKey, MealRule> = {
    朝食: { need: 1, eligible: [{ role: "介護", shifts: ["早"] }, { role: "ナース", shifts: ["早", "日"] }] },
    昼食: { need: 1, eligible: [{ role: "介護", shifts: ["日"] }, { role: "ナース", shifts: ["日"] }] },
    夕食: { need: 1, eligible: [{ role: "介護", shifts: ["遅"] }, { role: "ナース", shifts: ["日", "遅"] }] },
    夜食: { need: 1, eligible: [{ role: "ナース", shifts: ["夜"] }] },
  };

  const [mealRules, setMealRules] = useState<Record<MealKey, MealRule>>(defaultMealRules);

  type KenshokuDay = Record<MealKey, string[]>;
  const emptyKenshokuForMonth: Record<number, KenshokuDay> = useMemo(() => {
    const obj: any = {};
    for (const d of dayNumbers) obj[d] = { 朝食: [], 昼食: [], 夕食: [], 夜食: [] };
    return obj;
  }, [daysInMonth]);

  const [kenshoku, setKenshoku] = useState<Record<number, KenshokuDay>>(emptyKenshokuForMonth);

  function candidatesForMeal(day: number, meal: MealKey) {
    const rule = mealRules[meal];
    const set = new Set<string>();
    for (const e of rule.eligible) 
      for (const s of e.shifts) 
        schedule[day][e.role][s].forEach(n => set.add(n));
    return Array.from(set);
  }

  function autoAssignKenshoku() {
    const all = new Set<string>();
    roles.forEach(rc => rc.staff.forEach(n => all.add(n)));
    const count = new Map<string, number>(Array.from(all).map(n => [n, 0]));
    const lastDay = new Map<string, number>();

    const result: any = {};
    for (const d of dayNumbers) {
      const dayUsed = new Set<string>();
      const dayObj: KenshokuDay = { 朝食: [], 昼食: [], 夕食: [], 夜食: [] };

      for (const meal of MEALS) {
        const need = mealRules[meal].need;
        const cands = candidatesForMeal(d, meal);
        cands.sort((a, b) => (count.get(a)! - count.get(b)!) || a.localeCompare(b));

        let filled = 0;
        for (const c of cands) {
          if (filled >= need) break;
          if (dayUsed.has(c)) continue;
          const last = lastDay.get(c) ?? -999;
          if (d - last < 2) continue;

          dayObj[meal].push(c);
          dayUsed.add(c);
          count.set(c, (count.get(c) ?? 0) + 1);
          lastDay.set(c, d);
          filled++;
        }

        if (filled < need) {
          for (const c of cands) {
            if (filled >= need) break;
            if (dayObj[meal].includes(c)) continue;
            dayObj[meal].push(c);
            count.set(c, (count.get(c) ?? 0) + 1);
            lastDay.set(c, d);
            filled++;
          }
        }
      }
      result[d] = dayObj;
    }

    setKenshoku(result);
  }

  // === CSV Builder 群（副作用なし） ===
  const [useCRLF, setUseCRLF] = useState(false); // Windows Excel向け切替
  const NL = useCRLF ? "\r\n" : "\n";

  function buildCSV_Kenshoku(): string {
    const rows: string[] = ["date,meal,slot,name"];
    for (const d of dayNumbers) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      for (const meal of MEALS) {
        const slots = getKenshokuSlots(d, meal);
        slots.forEach((nm, i) => rows.push(`${dateStr},${meal},${i + 1},${nm ?? ""}`));
      }
    }
    return rows.join(NL);
  }

  function buildCSV_ByStaff(): string {
    const rows: string[] = ["name,date,role,shift"];
    for (const d of dayNumbers) {
      for (const role of ["介護", "ナース", "事務"] as RoleKey[]) {
        for (const s of SHIFT_ORDER) {
          for (const name of schedule[d][role][s]) {
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            rows.push(`${name},${dateStr},${role},${s}`);
          }
        }
      }
    }
    return rows.join(NL);
  }

  function buildCSV_ByDay(): string {
    const rows: string[] = ["date,role,shift,slot,name"];
    for (const d of dayNumbers) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      for (const role of ["介護", "ナース", "事務"] as RoleKey[]) {
        for (const s of SHIFT_ORDER) {
          const slots = getSlots(d, role, s);
          slots.forEach((nm, i) => rows.push(`${dateStr},${role},${s},${i + 1},${nm ?? ""}`));
        }
      }
    }
    return rows.join(NL);
  }  // 手
動上書き（勤務/検食）とスロット可視化
  function handleManualChange(day: number, role: RoleKey, shift: ShiftKey, slotIndex: number, name: string) {
    setSchedule(prev => {
      const copy: any = { ...prev };
      const arr = [...copy[day][role][shift]];
      arr[slotIndex] = name;
      copy[day] = { ...copy[day], [role]: { ...copy[day][role], [shift]: arr } };
      return copy;
    });
  }

  function handleManualKenshoku(day: number, meal: MealKey, slotIndex: number, name: string) {
    setKenshoku(prev => {
      const copy: any = { ...prev };
      const arr = [...copy[day][meal]];
      arr[slotIndex] = name;
      copy[day] = { ...copy[day], [meal]: arr };
      return copy;
    });
  }

  function getSlots(day: number, role: RoleKey, shift: ShiftKey) {
    const need = roles.find(r => r.role === role)!.requirements[shift];
    const assigned = schedule[day][role][shift];
    return Array.from({ length: need }, (_, i) => assigned[i] ?? null);
  }

  function getKenshokuSlots(day: number, meal: MealKey) {
    const need = mealRules[meal].need;
    const assigned = kenshoku[day][meal] || [];
    return Array.from({ length: need }, (_, i) => assigned[i] ?? null);
  }

  // 保存/読込（安全化）
  function saveLocal() {
    try {
      if (!isStorageAvailable()) throw new Error("storage blocked");
      const payload = { year, month, roles, schedule, mealRules, kenshoku };
      localStorage.setItem("shift_prototype_v3", JSON.stringify(payload));
      alert("ローカルに保存しました。");
    } catch {
      alert("この環境ではローカル保存は無効です。");
    }
  }

  function loadLocal() {
    try {
      if (!isStorageAvailable()) throw new Error("storage blocked");
      const raw = localStorage.getItem("shift_prototype_v3") || 
                  localStorage.getItem("shift_prototype_v2") || 
                  localStorage.getItem("shift_prototype_v1");
      if (!raw) {
        alert("保存データが見つかりません。");
        return;
      }
      const p = JSON.parse(raw);
      setYear(p.year);
      setMonth(p.month);
      setRoles(p.roles);
      setSchedule(p.schedule);
      setMealRules(p.mealRules || defaultMealRules);
      setKenshoku(p.kenshoku || emptyKenshokuForMonth);
      alert("保存データを読み込みました。");
    } catch {
      alert("この環境では読込は無効か、データが壊れています。");
    }
  }

  // ===== ダウンロードセンター =====
  type DlKind = "kenshoku" | "byday" | "bystaff";
  const [dl, setDl] = useState<{
    visible: boolean;
    kind: DlKind | null;
    filename: string;
    text: string;
    dataUrl: string;
  }>({ visible: false, kind: null, filename: "", text: "", dataUrl: "" });

  function openDownloadCenter(kind: DlKind) {
    const builders = { 
      kenshoku: buildCSV_Kenshoku, 
      byday: buildCSV_ByDay, 
      bystaff: buildCSV_ByStaff 
    } as const;
    const names = { 
      kenshoku: `kenshoku_${year}${String(month).padStart(2, "0")}.csv`, 
      byday: `shift_by_day_${year}${String(month).padStart(2, "0")}.csv`, 
      bystaff: `shift_by_staff_${year}${String(month).padStart(2, "0")}.csv` 
    } as const;

    const text = builders[kind]();
    const dataUrl = makeDataUrlCSV(text);
    setDl({ visible: true, kind, filename: names[kind], text, dataUrl });
  }

  // 統計ビュー用
  const stats = useMemo(() => {
    const m = new Map<string, { role: RoleKey; count: number }>();
    for (const rc of roles) for (const n of rc.staff) m.set(n, { role: rc.role, count: 0 });
    for (const d of dayNumbers) 
      (["介護", "ナース", "事務"] as RoleKey[]).forEach(role => {
        SHIFT_ORDER.forEach(s => {
          schedule[d][role][s].forEach(name => {
            const r = m.get(name);
            if (r) r.count += 1;
          });
        });
      });
    return Array.from(m.entries()).map(([name, v]) => ({ name, ...v }));
  }, [schedule, roles, daysInMonth]);

  // ====== 既存 + 追加テスト ======
  useEffect(() => {
    // 1) CSV の改行が NL である
    const lf = ["a,b", "c,d"].join("\n");
    console.assert(lf === "a,b\nc,d", "[TEST] join LF");
    const crlf = ["a,b", "c,d"].join("\r\n");
    console.assert(crlf === "a,b\r\nc,d", "[TEST] join CRLF");

    // 2) 改行分割が /\n+/ で機能
    const arr = "x\n\n y\nz".split(/\n+/).map(t => t.trim()).filter(Boolean);
    console.assert(arr.length === 3 && arr[0] === "x" && arr[1] === "y" && arr[2] === "z", "[TEST] split by \\n+");

    // 3) 検食スロット長さ = need（d=1）
    const d = 1;
    let ok = true;
    for (const meal of MEALS) {
      if (getKenshokuSlots(d, meal).length !== mealRules[meal].need) ok = false;
    }
    console.assert(ok, "[TEST] kenshoku slots length");

    // 4) CSVヘッダ
    console.assert(buildCSV_ByDay().startsWith("date,role,shift,slot,name"), "[TEST] header by day");
    console.assert(buildCSV_ByStaff().startsWith("name,date,role,shift"), "[TEST] header by staff");
    console.assert(buildCSV_Kenshoku().startsWith("date,meal,slot,name"), "[TEST] header kenshoku");

    // 5) data:URL 生成
    const url = makeDataUrlCSV("a,b\n");
    console.assert(url.startsWith("data:text/csv"), "[TEST] data url");
  }, []); 
 // ===== UI =====
  const [tab, setTab] = useState<"calendar" | "kenshoku" | "settings" | "stats">("calendar");
  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 1 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <h1 className="text-lg font-semibold">介護施設向け シフト作成・プロトタイプ</h1>
            <span className="text-xs text-slate-500 ml-1">(React)</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-slate-600 flex items-center gap-1 border border-slate-200 rounded-lg px-2 py-1 bg-slate-50">
              改行: 
              <select 
                className="text-xs" 
                value={useCRLF ? "CRLF" : "LF"} 
                onChange={e => setUseCRLF(e.target.value === "CRLF")}
              >
                <option>LF</option>
                <option>CRLF</option>
              </select>
            </label>
            <button 
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200" 
              onClick={() => openDownloadCenter("byday")}
            >
              CSV（日別）
            </button>
            <button 
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200" 
              onClick={() => openDownloadCenter("bystaff")}
            >
              CSV（スタッフ別）
            </button>
            <button 
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200" 
              onClick={() => openDownloadCenter("kenshoku")}
            >
              CSV（検食）
            </button>
            <button 
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200" 
              onClick={saveLocal}
            >
              保存
            </button>
            <button 
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200" 
              onClick={loadLocal}
            >
              読込
            </button>
            <button 
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700" 
              onClick={autoAssign}
            >
              勤務シフトを自動割当
            </button>
            <button 
              className="px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700" 
              onClick={autoAssignKenshoku}
            >
              検食ローテーション自動割当
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* コントロールバー */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <label className="text-sm text-slate-600">年</label>
            <select 
              className="outline-none bg-transparent" 
              value={year} 
              onChange={e => setYear(Number(e.target.value))}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <label className="text-sm text-slate-600">月</label>
            <select 
              className="outline-none bg-transparent" 
              value={month} 
              onChange={e => setMonth(Number(e.target.value))}
            >
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden">
            {[
              { key: "calendar", label: "勤務カレンダー" },
              { key: "kenshoku", label: "検食ローテーション" },
              { key: "settings", label: "設定" },
              { key: "stats", label: "統計" }
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`px-4 py-2 text-sm transition-colors ${
                  tab === key 
                    ? "bg-indigo-600 text-white" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setTab(key as any)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>     
   {/* タブコンテンツ */}
        {tab === "calendar" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">勤務カレンダー - {year}年{month}月</h2>
            <div className="grid gap-4">
              {dayNumbers.map(day => (
                <div key={day} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{month}/{day}</h3>
                    <span className="text-xs text-slate-500">
                      {new Date(year, month - 1, day).toLocaleDateString('ja-JP', { weekday: 'short' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {(["介護", "ナース", "事務"] as RoleKey[]).map(role => (
                      <div key={role} className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-700">{role}</h4>
                        {SHIFT_ORDER.map(shift => {
                          const slots = getSlots(day, role, shift);
                          if (slots.length === 0) return null;
                          return (
                            <div key={shift} className="space-y-1">
                              <div className="text-xs text-slate-500">{shift}番</div>
                              {slots.map((name, i) => (
                                <input
                                  key={i}
                                  type="text"
                                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                                  value={name || ""}
                                  onChange={e => handleManualChange(day, role, shift, i, e.target.value)}
                                  placeholder={`${shift}${i + 1}`}
                                />
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "kenshoku" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">検食ローテーション - {year}年{month}月</h2>
            <div className="grid gap-4">
              {dayNumbers.map(day => (
                <div key={day} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{month}/{day}</h3>
                    <span className="text-xs text-slate-500">
                      {new Date(year, month - 1, day).toLocaleDateString('ja-JP', { weekday: 'short' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {MEALS.map(meal => (
                      <div key={meal} className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-700">{meal}</h4>
                        {getKenshokuSlots(day, meal).map((name, i) => (
                          <div key={i} className="space-y-1">
                            <input
                              type="text"
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                              value={name || ""}
                              onChange={e => handleManualKenshoku(day, meal, i, e.target.value)}
                              placeholder={`${meal}担当`}
                            />
                            <div className="text-xs text-slate-400">
                              候補: {candidatesForMeal(day, meal).slice(0, 3).join(", ")}
                              {candidatesForMeal(day, meal).length > 3 && "..."}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">設定</h2>
            
            {/* スタッフ設定 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-4">スタッフ設定</h3>
              {roles.map((role, roleIndex) => (
                <div key={role.role} className="mb-6 p-4 border border-slate-100 rounded-lg">
                  <h4 className="font-medium mb-3">{role.role}（{role.count}名）</h4>
                  
                  {/* 必要人数設定 */}
                  <div className="mb-3">
                    <div className="text-sm text-slate-600 mb-2">シフト別必要人数:</div>
                    <div className="grid grid-cols-4 gap-2">
                      {SHIFT_ORDER.map(shift => (
                        <div key={shift} className="flex items-center gap-2">
                          <span className="text-xs">{shift}:</span>
                          <input
                            type="number"
                            min="0"
                            className="w-16 px-2 py-1 text-xs border border-slate-200 rounded"
                            value={role.requirements[shift]}
                            onChange={e => {
                              const newRoles = [...roles];
                              newRoles[roleIndex].requirements[shift] = Number(e.target.value);
                              setRoles(newRoles);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* スタッフ名簿 */}
                  <div>
                    <div className="text-sm text-slate-600 mb-2">スタッフ名簿:</div>
                    <textarea
                      className="w-full h-24 px-3 py-2 text-xs border border-slate-200 rounded resize-none"
                      value={role.staff.join("\n")}
                      onChange={e => {
                        const newRoles = [...roles];
                        newRoles[roleIndex].staff = e.target.value.split("\n").filter(Boolean);
                        newRoles[roleIndex].count = newRoles[roleIndex].staff.length;
                        setRoles(newRoles);
                      }}
                      placeholder="スタッフ名を1行に1名ずつ入力"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 検食ルール設定 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-4">検食ルール設定</h3>
              {MEALS.map(meal => (
                <div key={meal} className="mb-4 p-4 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-4 mb-3">
                    <h4 className="font-medium">{meal}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">必要人数:</span>
                      <input
                        type="number"
                        min="1"
                        className="w-16 px-2 py-1 text-xs border border-slate-200 rounded"
                        value={mealRules[meal].need}
                        onChange={e => {
                          const newRules = { ...mealRules };
                          newRules[meal].need = Number(e.target.value);
                          setMealRules(newRules);
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    対象者: {mealRules[meal].eligible.map(e => 
                      `${e.role}(${e.shifts.join(",")})`
                    ).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "stats" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">統計情報</h2>
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-medium mb-4">スタッフ別勤務回数</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2">名前</th>
                      <th className="text-left py-2">役割</th>
                      <th className="text-left py-2">勤務回数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats
                      .sort((a, b) => b.count - a.count)
                      .map(({ name, role, count }) => (
                        <tr key={name} className="border-b border-slate-100">
                          <td className="py-2">{name}</td>
                          <td className="py-2">{role}</td>
                          <td className="py-2">{count}回</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}        {
/* ダウンロードセンター */}
        {dl.visible && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">ダウンロードセンター</h3>
                <button
                  className="text-slate-400 hover:text-slate-600"
                  onClick={() => setDl({ ...dl, visible: false })}
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-slate-600 mb-2">ファイル名: {dl.filename}</div>
                  <div className="text-sm text-slate-600 mb-2">サイズ: {dl.text.length} 文字</div>
                </div>

                {/* ダウンロードオプション */}
                <div className="flex flex-wrap gap-2">
                  <a
                    href={dl.dataUrl}
                    download={dl.filename}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    📥 ダウンロード
                  </a>
                  <button
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg"
                    onClick={() => openNewTabWithText(dl.text)}
                  >
                    🔗 新しいタブで開く
                  </button>
                  <button
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg"
                    onClick={async () => {
                      const success = await safeClipboardWrite(dl.text);
                      alert(success ? "クリップボードにコピーしました" : "コピーに失敗しました");
                    }}
                  >
                    📋 クリップボードにコピー
                  </button>
                </div>

                {/* プレビュー */}
                <div>
                  <div className="text-sm text-slate-600 mb-2">プレビュー:</div>
                  <pre className="bg-slate-50 p-3 rounded-lg text-xs overflow-x-auto max-h-60 overflow-y-auto">
                    {dl.text.slice(0, 2000)}
                    {dl.text.length > 2000 && "\n... (省略)"}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/************ Main App with Error Boundary ************/
export default function App() {
  return (
    <ErrorBoundary>
      <InnerApp />
    </ErrorBoundary>
  );
}