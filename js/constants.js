// 定数定義

const SHIFT_ORDER = ["夜", "早", "日", "遅"];
const MEALS = ["朝食", "昼食", "夕食", "夜食"];
const ROLES = ["介護", "ナース", "事務"];

// 初期スタッフ設定
function createDefaultConfigs() {
    const makeStaff = (label, n) => Array.from({ length: n }, (_, i) => ({
        id: `${label}_${Utils.padNumber(i + 1)}`,
        name: `${label}${Utils.padNumber(i + 1)}`,
        role: label,
        active: true,
        mealRestrictions: [],
        shiftRestrictions: [],
        notes: ""
    }));

    return [
        { 
            role: "介護", 
            count: 40, 
            requirements: { 早: 3, 日: 6, 遅: 3, 夜: 2 }, 
            staff: makeStaff("介護", 40) 
        },
        { 
            role: "ナース", 
            count: 11, 
            requirements: { 早: 0, 日: 2, 遅: 0, 夜: 1 }, 
            staff: makeStaff("ナース", 11) 
        },
        { 
            role: "事務", 
            count: 6, 
            requirements: { 早: 0, 日: 2, 遅: 0, 夜: 0 }, 
            staff: makeStaff("事務", 6) 
        },
    ];
}

// 検食ルール
const DEFAULT_MEAL_RULES = {
    朝食: { 
        need: 1, 
        eligible: [
            { role: "介護", shifts: ["早"] }, 
            { role: "ナース", shifts: ["早", "日"] }
        ] 
    },
    昼食: { 
        need: 1, 
        eligible: [
            { role: "介護", shifts: ["日"] }, 
            { role: "ナース", shifts: ["日"] }
        ] 
    },
    夕食: { 
        need: 1, 
        eligible: [
            { role: "介護", shifts: ["遅"] }, 
            { role: "ナース", shifts: ["日", "遅"] }
        ] 
    },
    夜食: { 
        need: 1, 
        eligible: [
            { role: "ナース", shifts: ["夜"] }
        ] 
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