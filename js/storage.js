// データ保存・読込機能

const STORAGE_KEY = "kenshoku_shift_v2";
const STORAGE_VERSION = "2.0";

// データ保存
function saveToLocal(data) {
    try {
        if (!Utils.isStorageAvailable()) throw new Error("storage blocked");
        const payload = { ...data, version: STORAGE_VERSION };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        return { success: true, message: "ローカルに保存しました。" };
    } catch {
        return { success: false, message: "この環境ではローカル保存は無効です。" };
    }
}

// データ読込
function loadFromLocal() {
    try {
        if (!Utils.isStorageAvailable()) throw new Error("storage blocked");
        const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("kenshoku_shift");
        
        if (!raw) {
            return { success: false, message: "保存データが見つかりません。" };
        }
        
        const data = JSON.parse(raw);
        
        // 旧バージョンからの移行処理
        if (!data.version || data.version !== STORAGE_VERSION) {
            const migratedRoles = data.roles.map(role => ({
                ...role,
                staff: role.staff.map(staffName => ({
                    id: `${role.role}_${staffName}`,
                    name: typeof staffName === 'string' ? staffName : staffName.name,
                    role: role.role,
                    active: true,
                    mealRestrictions: [],
                    shiftRestrictions: [],
                    notes: ""
                }))
            }));
            data.roles = migratedRoles;
        }
        
        return { 
            success: true, 
            message: "保存データを読み込みました。",
            data: data
        };
    } catch {
        return { success: false, message: "この環境では読込は無効か、データが壊れています。" };
    }
}

// データクリア
function clearLocalData() {
    try {
        if (!Utils.isStorageAvailable()) throw new Error("storage blocked");
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("kenshoku_shift"); // 旧バージョンも削除
        return { success: true, message: "保存データを削除しました。" };
    } catch {
        return { success: false, message: "データの削除に失敗しました。" };
    }
}

// エクスポート
window.Storage = {
    saveToLocal,
    loadFromLocal,
    clearLocalData
};