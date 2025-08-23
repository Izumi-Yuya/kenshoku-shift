// 定数定義

const SHIFT_ORDER = ["夜", "早", "日", "遅"];
const MEALS = ["朝食", "昼食", "夕食", "夜食"];
const ROLES = ["看護師", "介護士", "相談員"];

// 初期スタッフ設定（軽量版）
function createDefaultConfigs() {
    const makeStaff = (label, n) => Array.from({ length: n }, (_, i) => ({
        id: `${label}_${Utils.padNumber(i + 1)}_${Date.now()}`,
        name: `${label}${Utils.padNumber(i + 1)}`,
        role: label,
        active: true,
        mealRestrictions: [],
        shiftRestrictions: [],
        notes: ""
    }));

    return [
        { 
            role: "看護師", 
            count: 5, 
            requirements: { 早: 1, 日: 2, 遅: 1, 夜: 1 }, 
            staff: makeStaff("看護師", 5) 
        },
        { 
            role: "介護士", 
            count: 8, 
            requirements: { 早: 2, 日: 3, 遅: 2, 夜: 1 }, 
            staff: makeStaff("介護士", 8) 
        },
        { 
            role: "相談員", 
            count: 2, 
            requirements: { 早: 0, 日: 1, 遅: 0, 夜: 0 }, 
            staff: makeStaff("相談員", 2) 
        },
    ];
}

// 検食ルール（簡素化）
const DEFAULT_MEAL_RULES = {
    朝食: { 
        need: 1, 
        roles: ["看護師", "介護士"]
    },
    昼食: { 
        need: 1, 
        roles: ["看護師", "介護士"]
    },
    夕食: { 
        need: 1, 
        roles: ["看護師", "介護士"]
    },
    夜食: { 
        need: 1, 
        roles: ["看護師"]
    },
};

// エクスポート
window.Constants = {
    SHIFT_ORDER,
    MEALS,
    ROLES,
    createDefaultConfigs,
    DEFAULT_MEAL_RULES
};