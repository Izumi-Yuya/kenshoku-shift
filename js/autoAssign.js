// 自動割当機能

// 勤務シフト自動割当
function autoAssignShifts(roles, dayNumbers) {
    const newSchedule = Schedule.createEmptySchedule(dayNumbers);
    const roleStats = Schedule.buildRoleStats(roles);

    for (const d of dayNumbers) {
        for (const rc of roles) {
            const req = rc.requirements;
            const stats = roleStats[rc.role];

            for (const shift of Constants.SHIFT_ORDER) {
                const need = req[shift];
                if (need <= 0) continue;

                const assignedToday = new Set();
                Object.values(newSchedule[d][rc.role]).forEach(arr => 
                    arr.forEach(n => assignedToday.add(n))
                );

                const pickCandidate = () => {
                    const candidates = rc.staff
                        .filter(staff => staff.active && !staff.shiftRestrictions.includes(shift))
                        .filter(staff => !assignedToday.has(staff.name))
                        .map(staff => staff.name);
                    
                    candidates.sort((a, b) => {
                        const A = stats.get(a);
                        const B = stats.get(b);
                        const pen = (st) => {
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
                        const st = stats.get(c);
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

            // 統計更新
            for (const staff of rc.staff) {
                const name = staff.name;
                const st = roleStats[rc.role].get(name);
                const todayShift = (() => {
                    for (const s of Constants.SHIFT_ORDER) {
                        if (newSchedule[d][rc.role][s].includes(name)) return s;
                    }
                    return "休";
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

    return newSchedule;
}

// 検食ローテーション自動割当
function autoAssignKenshoku(roles, schedule, mealRules, dayNumbers) {
    const all = new Set();
    roles.forEach(rc => rc.staff.forEach(staff => {
        if (staff.active) all.add(staff.name);
    }));
    const count = new Map(Array.from(all).map(n => [n, 0]));
    const lastDay = new Map();

    const result = {};
    for (const d of dayNumbers) {
        const dayUsed = new Set();
        const dayObj = {};
        Constants.MEALS.forEach(meal => {
            dayObj[meal] = [];
        });

        for (const meal of Constants.MEALS) {
            const need = mealRules[meal].need;
            const cands = Schedule.getCandidatesForMeal(schedule, roles, mealRules, d, meal);
            cands.sort((a, b) => (count.get(a) - count.get(b)) || a.localeCompare(b));

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

    return result;
}

// エクスポート
window.AutoAssign = {
    autoAssignShifts,
    autoAssignKenshoku
};