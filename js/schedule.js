// スケジュール管理関連の関数

// 空のスケジュール構造を作成
function createEmptyDay() {
    const day = {};
    Constants.ROLES.forEach(role => {
        day[role] = {};
        Constants.SHIFT_ORDER.forEach(shift => {
            day[role][shift] = [];
        });
    });
    return day;
}

function createEmptySchedule(dayNumbers) {
    const schedule = {};
    dayNumbers.forEach(d => {
        schedule[d] = createEmptyDay();
    });
    return schedule;
}

// 空の検食スケジュールを作成
function createEmptyKenshoku(dayNumbers) {
    const kenshoku = {};
    dayNumbers.forEach(d => {
        kenshoku[d] = {};
        Constants.MEALS.forEach(meal => {
            kenshoku[d][meal] = [];
        });
    });
    return kenshoku;
}

// スタッフ統計の初期化
function makeInitialStats(staffList) {
    const m = new Map();
    staffList.forEach(staff => m.set(staff.name, { 
        total: 0, 
        consecDays: 0, 
        lastShift: null, 
        nightsIn7: [] 
    }));
    return m;
}

function buildRoleStats(roles) {
    return roles.reduce((acc, rc) => {
        acc[rc.role] = makeInitialStats(rc.staff);
        return acc;
    }, {});
}

// スロット管理
function getSlots(schedule, roles, day, role, shift) {
    const need = roles.find(r => r.role === role)?.requirements[shift] || 0;
    const assigned = schedule[day][role][shift] || [];
    return Array.from({ length: need }, (_, i) => assigned[i] ?? null);
}

function getKenshokuSlots(kenshoku, mealRules, day, meal) {
    const need = mealRules[meal].need;
    const assigned = kenshoku[day][meal] || [];
    return Array.from({ length: need }, (_, i) => assigned[i] ?? null);
}

// 利用可能スタッフの取得
function getAvailableStaff(roles, role, shift) {
    return roles.find(r => r.role === role)?.staff
        .filter(staff => staff.active && !staff.shiftRestrictions.includes(shift))
        .map(staff => staff.name) || [];
}

// 検食候補者の取得
function getCandidatesForMeal(schedule, roles, mealRules, day, meal) {
    const rule = mealRules[meal];
    const set = new Set();
    
    for (const e of rule.eligible) {
        for (const s of e.shifts) {
            schedule[day][e.role][s].forEach(name => {
                const staff = roles.find(r => r.role === e.role)?.staff.find(st => st.name === name);
                if (staff && staff.active && !staff.mealRestrictions.includes(meal)) {
                    set.add(name);
                }
            });
        }
    }
    return Array.from(set);
}

// エクスポート
window.Schedule = {
    createEmptyDay,
    createEmptySchedule,
    createEmptyKenshoku,
    makeInitialStats,
    buildRoleStats,
    getSlots,
    getKenshokuSlots,
    getAvailableStaff,
    getCandidatesForMeal
};