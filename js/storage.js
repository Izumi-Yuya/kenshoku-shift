// CSV保存・読込機能（強化版）

const FILE_VERSION = "2.0";

// 設定データのCSV保存（強化版）
function saveSettingsToCSV(data, useCRLF = false) {
    try {
        const csvData = CSV.generateSettingsCSVData(data.roles, data.mealRules, useCRLF);
        
        // ファイルダウンロードを実行
        const link = document.createElement('a');
        link.href = csvData.dataUrl;
        link.download = csvData.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return { 
            success: true, 
            message: `✅ 設定データをCSVファイル「${csvData.filename}」として保存しました。`,
            filename: csvData.filename
        };
    } catch (error) {
        return { 
            success: false, 
            message: `❌ CSV保存に失敗しました: ${error.message}` 
        };
    }
}

// 完全データのCSV保存（設定+シフト+検食データ）
function saveAllDataToCSV(data, useCRLF = false) {
    try {
        const csvData = CSV.generateCompleteCSVData(data, useCRLF);
        
        // ファイルダウンロードを実行
        const link = document.createElement('a');
        link.href = csvData.dataUrl;
        link.download = csvData.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return { 
            success: true, 
            message: `✅ 全データをCSVファイル「${csvData.filename}」として保存しました。`,
            filename: csvData.filename
        };
    } catch (error) {
        return { 
            success: false, 
            message: `❌ CSV保存に失敗しました: ${error.message}` 
        };
    }
}

// 複数ファイル一括保存（ZIP風）
function saveMultipleCSV(data, useCRLF = false) {
    try {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const results = [];
        
        // 設定データ
        const settingsData = CSV.generateSettingsCSVData(data.roles, data.mealRules, useCRLF);
        downloadFile(settingsData.dataUrl, `settings_${timestamp}.csv`);
        results.push('設定データ');
        
        // シフトデータ
        if (data.schedule && Object.keys(data.schedule).length > 0) {
            const shiftData = CSV.generateCSVData('shift', data.year, data.month, 
                Utils.getDayNumbers(Utils.getDaysInMonth(data.year, data.month)), 
                data.schedule, data.kenshoku, data.roles, data.mealRules, useCRLF);
            downloadFile(shiftData.dataUrl, `shift_${timestamp}.csv`);
            results.push('勤務シフト');
        }
        
        // 検食データ
        if (data.kenshoku && Object.keys(data.kenshoku).length > 0) {
            const kenshokuData = CSV.generateCSVData('kenshoku', data.year, data.month, 
                Utils.getDayNumbers(Utils.getDaysInMonth(data.year, data.month)), 
                data.schedule, data.kenshoku, data.roles, data.mealRules, useCRLF);
            downloadFile(kenshokuData.dataUrl, `kenshoku_${timestamp}.csv`);
            results.push('検食ローテーション');
        }
        
        // スタッフ別データ
        if (data.schedule && Object.keys(data.schedule).length > 0) {
            const staffData = CSV.generateCSVData('bystaff', data.year, data.month, 
                Utils.getDayNumbers(Utils.getDaysInMonth(data.year, data.month)), 
                data.schedule, data.kenshoku, data.roles, data.mealRules, useCRLF);
            downloadFile(staffData.dataUrl, `staff_${timestamp}.csv`);
            results.push('スタッフ別勤務表');
        }
        
        return { 
            success: true, 
            message: `✅ ${results.length}個のCSVファイルを保存しました:\n• ${results.join('\n• ')}`,
            count: results.length
        };
    } catch (error) {
        return { 
            success: false, 
            message: `❌ 一括CSV保存に失敗しました: ${error.message}` 
        };
    }
}

// ファイルダウンロードヘルパー
function downloadFile(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 連続ダウンロードのための小さな遅延
    return new Promise(resolve => setTimeout(resolve, 100));
}

// 設定データCSV読み込み
function loadSettingsFromCSV(file) {
    return new Promise((resolve) => {
        if (!file) {
            resolve({ success: false, message: "ファイルが選択されていません。" });
            return;
        }
        
        if (!file.name.toLowerCase().endsWith('.csv')) {
            resolve({ success: false, message: "CSVファイルを選択してください。" });
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const csvText = e.target.result;
                console.log('設定CSV読み込み開始:', file.name, 'サイズ:', csvText.length);
                
                const parsedData = CSV.parseCSV_Settings(csvText);
                
                if (!parsedData.roles || parsedData.roles.length === 0) {
                    resolve({ 
                        success: false, 
                        message: "有効な役職データが見つかりませんでした。CSVファイルの形式を確認してください。\n\n期待される形式:\n# Staff Information\nrole,name,active,meal_restrictions,shift_restrictions,notes\n看護師,田中花子,true,,," 
                    });
                    return;
                }
                
                // データの妥当性チェック
                let staffCount = 0;
                for (const role of parsedData.roles) {
                    staffCount += role.staff ? role.staff.length : 0;
                }
                
                resolve({ 
                    success: true, 
                    message: `✅ CSVファイル「${file.name}」から設定データを読み込みました。\n📊 役職: ${parsedData.roles.length}種類\n👥 スタッフ: ${staffCount}名\n🍽️ 検食設定: ${Object.keys(parsedData.mealRules).length}食事`,
                    data: {
                        ...parsedData,
                        version: FILE_VERSION
                    }
                });
            } catch (error) {
                console.error('設定CSV読み込みエラー:', error);
                resolve({ 
                    success: false, 
                    message: `設定CSV読み込みに失敗しました: ${error.message}\n\nファイル形式を確認してください。` 
                });
            }
        };
        
        reader.onerror = function() {
            resolve({ 
                success: false, 
                message: "ファイルの読み込みに失敗しました。" 
            });
        };
        
        reader.readAsText(file, 'UTF-8');
    });
}

// 完全データCSV読み込み
function loadAllDataFromCSV(file) {
    return new Promise((resolve) => {
        if (!file) {
            resolve({ success: false, message: "ファイルが選択されていません。" });
            return;
        }
        
        if (!file.name.toLowerCase().endsWith('.csv')) {
            resolve({ success: false, message: "CSVファイルを選択してください。" });
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const csvText = e.target.result;
                console.log('完全データCSV読み込み開始:', file.name, 'サイズ:', csvText.length);
                
                // 完全データの解析を試行
                const parsedData = CSV.parseCompleteCSV(csvText);
                
                if (!parsedData.roles || parsedData.roles.length === 0) {
                    resolve({ 
                        success: false, 
                        message: "有効なデータが見つかりませんでした。CSVファイルの形式を確認してください。" 
                    });
                    return;
                }
                
                resolve({ 
                    success: true, 
                    message: `✅ CSVファイル「${file.name}」から全データを読み込みました。`,
                    data: {
                        ...parsedData,
                        version: FILE_VERSION
                    }
                });
            } catch (error) {
                console.error('完全データCSV読み込みエラー:', error);
                resolve({ 
                    success: false, 
                    message: `完全データCSV読み込みに失敗しました: ${error.message}` 
                });
            }
        };
        
        reader.onerror = function() {
            resolve({ 
                success: false, 
                message: "ファイルの読み込みに失敗しました。" 
            });
        };
        
        reader.readAsText(file, 'UTF-8');
    });
}

// エクスポート
window.Storage = {
    saveSettingsToCSV,
    saveAllDataToCSV,
    saveMultipleCSV,
    loadSettingsFromCSV,
    loadAllDataFromCSV
};