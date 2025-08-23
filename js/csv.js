// CSV出力機能

// 検食CSV生成
function buildCSV_Kenshoku(year, month, dayNumbers, kenshoku, mealRules, useCRLF = false) {
    const NL = useCRLF ? "\r\n" : "\n";
    const rows = ["date,meal,slot,name"];
    
    for (const d of dayNumbers) {
        const dateStr = Utils.formatDate(year, month, d);
        for (const meal of Constants.MEALS) {
            const slots = Schedule.getKenshokuSlots(kenshoku, mealRules, d, meal);
            slots.forEach((nm, i) => rows.push(`${dateStr},${meal},${i + 1},${nm ?? ""}`));
        }
    }
    return rows.join(NL);
}

// 勤務シフトCSV生成
function buildCSV_Shift(year, month, dayNumbers, schedule, roles, useCRLF = false) {
    const NL = useCRLF ? "\r\n" : "\n";
    const rows = ["date,role,shift,slot,name"];
    
    for (const d of dayNumbers) {
        const dateStr = Utils.formatDate(year, month, d);
        for (const role of Constants.ROLES) {
            for (const shift of Constants.SHIFT_ORDER) {
                const slots = Schedule.getSlots(schedule, roles, d, role, shift);
                slots.forEach((nm, i) => rows.push(`${dateStr},${role},${shift},${i + 1},${nm ?? ""}`));
            }
        }
    }
    return rows.join(NL);
}

// スタッフ別勤務CSV生成
function buildCSV_ByStaff(year, month, dayNumbers, schedule, roles, useCRLF = false) {
    const NL = useCRLF ? "\r\n" : "\n";
    const rows = ["name,date,role,shift"];
    
    for (const d of dayNumbers) {
        const dateStr = Utils.formatDate(year, month, d);
        for (const role of Constants.ROLES) {
            for (const shift of Constants.SHIFT_ORDER) {
                const slots = Schedule.getSlots(schedule, roles, d, role, shift);
                slots.forEach(name => {
                    if (name) rows.push(`${name},${dateStr},${role},${shift}`);
                });
            }
        }
    }
    return rows.join(NL);
}

// CSV出力データ生成
function generateCSVData(kind, year, month, dayNumbers, schedule, kenshoku, roles, mealRules, useCRLF = false) {
    const builders = {
        kenshoku: () => buildCSV_Kenshoku(year, month, dayNumbers, kenshoku, mealRules, useCRLF),
        shift: () => buildCSV_Shift(year, month, dayNumbers, schedule, roles, useCRLF),
        bystaff: () => buildCSV_ByStaff(year, month, dayNumbers, schedule, roles, useCRLF)
    };
    
    const names = {
        kenshoku: `kenshoku_${year}${Utils.padNumber(month)}.csv`,
        shift: `shift_${year}${Utils.padNumber(month)}.csv`,
        bystaff: `staff_shift_${year}${Utils.padNumber(month)}.csv`
    };
    
    const text = builders[kind]();
    const filename = names[kind];
    const dataUrl = Utils.makeDataUrlCSV(text);
    
    return { text, filename, dataUrl };
}

// エクスポート
window.CSV = {
    buildCSV_Kenshoku,
    buildCSV_Shift,
    buildCSV_ByStaff,
    generateCSVData
};