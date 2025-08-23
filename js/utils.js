// ユーティリティ関数群

// ストレージ関連
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

// クリップボード関連
async function safeClipboardWrite(text) {
    try {
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {}
    try {
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

// CSV関連
function makeDataUrlCSV(text) {
    const prefix = "data:text/csv;charset=utf-8,\uFEFF";
    return prefix + encodeURIComponent(text);
}

// 日付関連
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

function getDayNumbers(daysInMonth) {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
}

function formatDate(year, month, day) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getWeekday(year, month, day) {
    return new Date(year, month - 1, day).toLocaleDateString('ja-JP', { weekday: 'short' });
}

// 配列関連
function padNumber(n, digits = 2) {
    return n.toString().padStart(digits, "0");
}

// エクスポート（グローバル変数として設定）
window.Utils = {
    isStorageAvailable,
    safeClipboardWrite,
    makeDataUrlCSV,
    getDaysInMonth,
    getDayNumbers,
    formatDate,
    getWeekday,
    padNumber
};