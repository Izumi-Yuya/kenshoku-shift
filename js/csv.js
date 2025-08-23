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

// 設定データCSV生成（スタッフ情報、シフト設定、検食設定）
function buildCSV_Settings(roles, mealRules, useCRLF = false) {
    const NL = useCRLF ? "\r\n" : "\n";
    const sections = [];
    
    // ファイル情報
    sections.push("// 介護施設向け検食シフト作成システム - 設定データ");
    sections.push(`// 出力日時: ${new Date().toLocaleString('ja-JP')}`);
    sections.push("");
    
    // スタッフ情報セクション
    sections.push("# Staff Information");
    sections.push("role,name,active,meal_restrictions,shift_restrictions,notes");
    
    for (const roleConfig of roles) {
        if (roleConfig.staff && roleConfig.staff.length > 0) {
            for (const staff of roleConfig.staff) {
                const mealRestrictions = (staff.mealRestrictions && staff.mealRestrictions.length > 0) 
                    ? staff.mealRestrictions.join(";") : "";
                const shiftRestrictions = (staff.shiftRestrictions && staff.shiftRestrictions.length > 0) 
                    ? staff.shiftRestrictions.join(";") : "";
                const notes = staff.notes ? `"${staff.notes.replace(/"/g, '""')}"` : "";
                sections.push(`${roleConfig.role},${staff.name},${staff.active},${mealRestrictions},${shiftRestrictions},${notes}`);
            }
        }
    }
    
    sections.push("");
    
    // シフト要件セクション
    sections.push("# Shift Requirements");
    sections.push("role,early,day,late,night");
    
    for (const roleConfig of roles) {
        const req = roleConfig.requirements || { 早: 0, 日: 0, 遅: 0, 夜: 0 };
        sections.push(`${roleConfig.role},${req.早 || 0},${req.日 || 0},${req.遅 || 0},${req.夜 || 0}`);
    }
    
    sections.push("");
    
    // 検食設定セクション
    sections.push("# Meal Rules");
    sections.push("meal,need,roles");
    
    for (const [meal, rule] of Object.entries(mealRules || {})) {
        const rolesStr = (rule.roles && rule.roles.length > 0) ? rule.roles.join(";") : "";
        sections.push(`${meal},${rule.need || 0},${rolesStr}`);
    }
    
    return sections.join(NL);
}

// 設定データCSV読み込み
function parseCSV_Settings(csvText) {
    console.log('CSV読み込み開始:', csvText.substring(0, 200) + '...');
    
    try {
        const lines = csvText.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('//'));
        const result = {
            roles: [],
            mealRules: {}
        };
        
        let currentSection = null;
        let staffData = [];
        let shiftData = [];
        let mealData = [];
    
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // セクションヘッダーの判定
            if (line.startsWith('#')) {
                currentSection = line.substring(1).trim();
                console.log('セクション変更:', currentSection);
                continue;
            }
            
            // ヘッダー行をスキップ
            if (line.includes('role,name,active') || line.includes('role,early,day') || line.includes('meal,need,roles')) {
                console.log('ヘッダー行をスキップ:', line);
                continue;
            }
            
            // 空行をスキップ
            if (!line.trim()) {
                continue;
            }
            
            // CSVの解析（カンマ区切り、ただし引用符内のカンマは除外）
            const columns = parseCSVLine(line);
            console.log(`行 ${i}: セクション=${currentSection}, カラム数=${columns.length}, データ=`, columns);
        
            if (currentSection === 'Staff Information' && columns.length >= 3) {
                const staff = {
                    role: columns[0] || '',
                    name: columns[1] || '',
                    active: columns[2] === 'true' || columns[2] === '1',
                    mealRestrictions: columns[3] ? columns[3].split(';').filter(r => r.trim()) : [],
                    shiftRestrictions: columns[4] ? columns[4].split(';').filter(r => r.trim()) : [],
                    notes: columns[5] || ""
                };
                staffData.push(staff);
                console.log('スタッフデータ追加:', staff);
            } else if (currentSection === 'Shift Requirements' && columns.length >= 5) {
                const shift = {
                    role: columns[0] || '',
                    requirements: {
                        早: parseInt(columns[1]) || 0,
                        日: parseInt(columns[2]) || 0,
                        遅: parseInt(columns[3]) || 0,
                        夜: parseInt(columns[4]) || 0
                    }
                };
                shiftData.push(shift);
                console.log('シフト要件追加:', shift);
            } else if (currentSection === 'Meal Rules' && columns.length >= 2) {
                const meal = {
                    meal: columns[0] || '',
                    need: parseInt(columns[1]) || 0,
                    roles: columns[2] ? columns[2].split(';').filter(r => r.trim()) : []
                };
                mealData.push(meal);
                console.log('検食設定追加:', meal);
            }
        }
    
        console.log('解析結果 - スタッフ:', staffData.length, 'シフト:', shiftData.length, '検食:', mealData.length);
        
        // スタッフデータを役職別にグループ化
        const roleMap = new Map();
        
        // デフォルトの役職を追加（データがない場合）
        const defaultRoles = ['看護師', '介護士', '相談員'];
        for (const role of defaultRoles) {
            if (!roleMap.has(role)) {
                roleMap.set(role, {
                    role: role,
                    staff: [],
                    requirements: { 早: 1, 日: 2, 遅: 1, 夜: 1 },
                    count: 0
                });
            }
        }
        
        // スタッフデータを処理
        for (const staff of staffData) {
            if (!staff.role || !staff.name) continue;
            
            if (!roleMap.has(staff.role)) {
                roleMap.set(staff.role, {
                    role: staff.role,
                    staff: [],
                    requirements: { 早: 1, 日: 2, 遅: 1, 夜: 1 },
                    count: 0
                });
            }
            
            const roleConfig = roleMap.get(staff.role);
            roleConfig.staff.push({
                id: `${staff.role}_${staff.name}_${Date.now()}`,
                name: staff.name,
                role: staff.role,
                active: staff.active,
                mealRestrictions: staff.mealRestrictions || [],
                shiftRestrictions: staff.shiftRestrictions || [],
                notes: staff.notes || ""
            });
        }
        
        // シフト要件を適用
        for (const shift of shiftData) {
            if (shift.role && roleMap.has(shift.role)) {
                roleMap.get(shift.role).requirements = shift.requirements;
            }
        }
        
        // カウントを更新
        for (const [role, config] of roleMap) {
            config.count = config.staff.length;
        }
        
        result.roles = Array.from(roleMap.values());
        
        // デフォルトの検食設定
        result.mealRules = {
            '朝食': { need: 1, roles: ['看護師', '介護士'] },
            '昼食': { need: 1, roles: ['看護師', '介護士'] },
            '夕食': { need: 1, roles: ['看護師', '介護士'] },
            '夜食': { need: 1, roles: ['看護師'] }
        };
        
        // 検食設定を適用
        for (const meal of mealData) {
            if (meal.meal) {
                result.mealRules[meal.meal] = {
                    need: meal.need,
                    roles: meal.roles.length > 0 ? meal.roles : ['看護師', '介護士']
                };
            }
        }
    
        console.log('最終結果:', result);
        return result;
    } catch (error) {
        console.error('CSV解析エラー:', error);
        throw new Error(`CSV解析に失敗しました: ${error.message}`);
    }
}

// CSV行の解析（引用符対応）
function parseCSVLine(line) {
    try {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    } catch (error) {
        console.error('CSV行解析エラー:', error, 'line:', line);
        return [];
    }
}

// 設定データCSV出力データ生成
function generateSettingsCSVData(roles, mealRules, useCRLF = false) {
    const text = buildCSV_Settings(roles, mealRules, useCRLF);
    const filename = `kenshoku_settings_${new Date().toISOString().slice(0, 10)}.csv`;
    const dataUrl = Utils.makeDataUrlCSV(text);
    
    return { text, filename, dataUrl };
}

// 完全データCSV生成（設定+シフト+検食データ）
function generateCompleteCSVData(data, useCRLF = false) {
    const NL = useCRLF ? "\r\n" : "\n";
    const sections = [];
    
    // ファイル情報
    sections.push("// 介護施設向け検食シフト作成システム - 完全データバックアップ");
    sections.push(`// 出力日時: ${new Date().toLocaleString('ja-JP')}`);
    sections.push(`// 対象期間: ${data.year}年${data.month}月`);
    sections.push("");
    
    // 設定データ部分
    const settingsCSV = buildCSV_Settings(data.roles, data.mealRules, useCRLF);
    sections.push(settingsCSV);
    sections.push("");
    
    // シフトデータ部分
    if (data.schedule && Object.keys(data.schedule).length > 0) {
        const dayNumbers = Utils.getDayNumbers(Utils.getDaysInMonth(data.year, data.month));
        sections.push("# Shift Schedule");
        sections.push("date,role,shift,slot,name");
        
        for (const d of dayNumbers) {
            const dateStr = Utils.formatDate(data.year, data.month, d);
            for (const role of Constants.ROLES) {
                for (const shift of Constants.SHIFT_ORDER) {
                    const slots = Schedule.getSlots(data.schedule, data.roles, d, role, shift);
                    slots.forEach((nm, i) => sections.push(`${dateStr},${role},${shift},${i + 1},${nm ?? ""}`));
                }
            }
        }
        sections.push("");
    }
    
    // 検食データ部分
    if (data.kenshoku && Object.keys(data.kenshoku).length > 0) {
        const dayNumbers = Utils.getDayNumbers(Utils.getDaysInMonth(data.year, data.month));
        sections.push("# Kenshoku Schedule");
        sections.push("date,meal,slot,name");
        
        for (const d of dayNumbers) {
            const dateStr = Utils.formatDate(data.year, data.month, d);
            for (const meal of Constants.MEALS) {
                const slots = Schedule.getKenshokuSlots(data.kenshoku, data.mealRules, d, meal);
                slots.forEach((nm, i) => sections.push(`${dateStr},${meal},${i + 1},${nm ?? ""}`));
            }
        }
    }
    
    const text = sections.join(NL);
    const filename = `kenshoku_complete_${data.year}${Utils.padNumber(data.month)}_${new Date().toISOString().slice(0, 10)}.csv`;
    const dataUrl = Utils.makeDataUrlCSV(text);
    
    return { text, filename, dataUrl };
}

// 完全データCSV解析
function parseCompleteCSV(csvText) {
    console.log('完全データCSV解析開始');
    
    try {
        const lines = csvText.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('//'));
        const result = {
            roles: [],
            mealRules: {},
            schedule: {},
            kenshoku: {},
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1
        };
        
        let currentSection = null;
        let staffData = [];
        let shiftData = [];
        let mealData = [];
        let scheduleData = [];
        let kenshokuData = [];
    
        // 年月の抽出
        const yearMonthMatch = csvText.match(/対象期間:\s*(\d{4})年(\d{1,2})月/);
        if (yearMonthMatch) {
            result.year = parseInt(yearMonthMatch[1]);
            result.month = parseInt(yearMonthMatch[2]);
        }
    
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.startsWith('#')) {
                currentSection = line.substring(1).trim();
                console.log('セクション変更:', currentSection);
                continue;
            }
            
            // ヘッダー行をスキップ
            if (line.includes('role,name,active') || 
                line.includes('role,early,day') || 
                line.includes('meal,need,roles') ||
                line.includes('date,role,shift,slot') ||
                line.includes('date,meal,slot,name')) {
                continue;
            }
            
            // 空行をスキップ
            if (!line.trim()) {
                continue;
            }
            
            const columns = parseCSVLine(line);
            console.log(`完全データ行 ${i}: セクション=${currentSection}, カラム数=${columns.length}`);
        
            if (currentSection === 'Staff Information' && columns.length >= 3) {
                staffData.push({
                    role: columns[0] || '',
                    name: columns[1] || '',
                    active: columns[2] === 'true' || columns[2] === '1',
                    mealRestrictions: columns[3] ? columns[3].split(';').filter(r => r.trim()) : [],
                    shiftRestrictions: columns[4] ? columns[4].split(';').filter(r => r.trim()) : [],
                    notes: columns[5] || ""
                });
            } else if (currentSection === 'Shift Requirements' && columns.length >= 5) {
                shiftData.push({
                    role: columns[0] || '',
                    requirements: {
                        早: parseInt(columns[1]) || 0,
                        日: parseInt(columns[2]) || 0,
                        遅: parseInt(columns[3]) || 0,
                        夜: parseInt(columns[4]) || 0
                    }
                });
            } else if (currentSection === 'Meal Rules' && columns.length >= 2) {
                mealData.push({
                    meal: columns[0] || '',
                    need: parseInt(columns[1]) || 0,
                    roles: columns[2] ? columns[2].split(';').filter(r => r.trim()) : []
                });
            } else if (currentSection === 'Shift Schedule' && columns.length >= 5) {
                scheduleData.push({
                    date: columns[0],
                    role: columns[1],
                    shift: columns[2],
                    slot: parseInt(columns[3]),
                    name: columns[4]
                });
            } else if (currentSection === 'Kenshoku Schedule' && columns.length >= 4) {
                kenshokuData.push({
                    date: columns[0],
                    meal: columns[1],
                    slot: parseInt(columns[2]),
                    name: columns[3]
                });
            }
        }
    
        // スタッフデータを役職別にグループ化
        const roleMap = new Map();
        const defaultRoles = ['看護師', '介護士', '相談員'];
        
        for (const role of defaultRoles) {
            if (!roleMap.has(role)) {
                roleMap.set(role, {
                    role: role,
                    staff: [],
                    requirements: { 早: 1, 日: 2, 遅: 1, 夜: 1 },
                    count: 0
                });
            }
        }
        
        for (const staff of staffData) {
            if (!staff.role || !staff.name) continue;
            
            if (!roleMap.has(staff.role)) {
                roleMap.set(staff.role, {
                    role: staff.role,
                    staff: [],
                    requirements: { 早: 1, 日: 2, 遅: 1, 夜: 1 },
                    count: 0
                });
            }
            
            const roleConfig = roleMap.get(staff.role);
            roleConfig.staff.push({
                id: `${staff.role}_${staff.name}_${Date.now()}`,
                name: staff.name,
                role: staff.role,
                active: staff.active,
                mealRestrictions: staff.mealRestrictions || [],
                shiftRestrictions: staff.shiftRestrictions || [],
                notes: staff.notes || ""
            });
        }
        
        // シフト要件を適用
        for (const shift of shiftData) {
            if (shift.role && roleMap.has(shift.role)) {
                roleMap.get(shift.role).requirements = shift.requirements;
            }
        }
        
        // カウントを更新
        for (const [role, config] of roleMap) {
            config.count = config.staff.length;
        }
        
        result.roles = Array.from(roleMap.values());
        
        // デフォルトの検食設定
        result.mealRules = {
            '朝食': { need: 1, roles: ['看護師', '介護士'] },
            '昼食': { need: 1, roles: ['看護師', '介護士'] },
            '夕食': { need: 1, roles: ['看護師', '介護士'] },
            '夜食': { need: 1, roles: ['看護師'] }
        };
        
        // 検食設定を適用
        for (const meal of mealData) {
            if (meal.meal) {
                result.mealRules[meal.meal] = {
                    need: meal.need,
                    roles: meal.roles.length > 0 ? meal.roles : ['看護師', '介護士']
                };
            }
        }
        
        // シフトデータを復元
        for (const shift of scheduleData) {
            if (!shift.name) continue;
            
            // 日付から日を抽出
            const dayMatch = shift.date.match(/(\d{1,2})$/);
            if (!dayMatch) continue;
            const day = parseInt(dayMatch[1]);
            
            if (!result.schedule[day]) result.schedule[day] = {};
            if (!result.schedule[day][shift.role]) result.schedule[day][shift.role] = {};
            if (!result.schedule[day][shift.role][shift.shift]) result.schedule[day][shift.role][shift.shift] = [];
            
            result.schedule[day][shift.role][shift.shift][shift.slot - 1] = shift.name;
        }
        
        // 検食データを復元
        for (const kenshoku of kenshokuData) {
            if (!kenshoku.name) continue;
            
            // 日付から日を抽出
            const dayMatch = kenshoku.date.match(/(\d{1,2})$/);
            if (!dayMatch) continue;
            const day = parseInt(dayMatch[1]);
            
            if (!result.kenshoku[day]) result.kenshoku[day] = {};
            if (!result.kenshoku[day][kenshoku.meal]) result.kenshoku[day][kenshoku.meal] = [];
            
            result.kenshoku[day][kenshoku.meal][kenshoku.slot - 1] = kenshoku.name;
        }
    
        console.log('完全データ解析完了:', result);
        return result;
    } catch (error) {
        console.error('完全データCSV解析エラー:', error);
        throw new Error(`完全データCSV解析に失敗しました: ${error.message}`);
    }
}

// エクスポート
window.CSV = {
    buildCSV_Kenshoku,
    buildCSV_Shift,
    buildCSV_ByStaff,
    generateCSVData,
    buildCSV_Settings,
    parseCSV_Settings,
    generateSettingsCSVData,
    generateCompleteCSVData,
    parseCompleteCSV,
    parseCSVLine
};