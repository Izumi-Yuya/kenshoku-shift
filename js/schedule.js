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
    // rolesとscheduleの存在確認
    if (!roles || !schedule || !schedule[day] || !schedule[day][role]) {
        return [];
    }
    
    const need = roles.find(r => r.role === role)?.requirements[shift] || 0;
    const assigned = schedule[day][role][shift] || [];
    return Array.from({ length: need }, (_, i) => assigned[i] ?? null);
}

function getKenshokuSlots(kenshoku, mealRules, day, meal) {
    // mealRulesとmealの存在確認
    if (!mealRules || !mealRules[meal]) {
        console.warn(`検食ルールが見つかりません: meal=${meal}, day=${day}`, {
            mealRules,
            availableMeals: mealRules ? Object.keys(mealRules) : 'mealRules is null/undefined'
        });
        return [];
    }
    
    const need = mealRules[meal].need || 0;
    const assigned = (kenshoku && kenshoku[day] && kenshoku[day][meal]) ? kenshoku[day][meal] : [];
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
    if (!rule) return [];
    
    const set = new Set();
    
    // 新しい構造（roles配列）に対応
    if (rule.roles && Array.isArray(rule.roles)) {
        for (const roleName of rule.roles) {
            const roleConfig = roles.find(r => r.role === roleName);
            if (!roleConfig) continue;
            
            // 全シフトから候補者を取得
            for (const shift of Constants.SHIFT_ORDER) {
                if (schedule[day] && schedule[day][roleName] && schedule[day][roleName][shift]) {
                    schedule[day][roleName][shift].forEach(name => {
                        if (name) {
                            const staff = roleConfig.staff.find(st => st.name === name);
                            if (staff && staff.active && !staff.mealRestrictions.includes(meal)) {
                                set.add(name);
                            }
                        }
                    });
                }
            }
        }
    }
    // 旧構造（eligible配列）にも対応（後方互換性）
    else if (rule.eligible && Array.isArray(rule.eligible)) {
        for (const e of rule.eligible) {
            for (const s of e.shifts) {
                if (schedule[day] && schedule[day][e.role] && schedule[day][e.role][s]) {
                    schedule[day][e.role][s].forEach(name => {
                        if (name) {
                            const staff = roles.find(r => r.role === e.role)?.staff.find(st => st.name === name);
                            if (staff && staff.active && !staff.mealRestrictions.includes(meal)) {
                                set.add(name);
                            }
                        }
                    });
                }
            }
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