// React コンポーネント群

// ヘッダーコンポーネント
function Header({ onAutoAssign, onAutoAssignKenshoku, onSave, onLoad, onOpenCSV }) {
    return React.createElement('header', {
        className: "sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200"
    },
        React.createElement('div', {
            className: "mx-auto max-w-7xl px-4 py-3 flex items-center justify-between"
        },
            React.createElement('div', {
                className: "flex items-center gap-3"
            },
                React.createElement('div', {
                    className: "w-2.5 h-2.5 rounded-full bg-indigo-600"
                }),
                React.createElement('h1', {
                    className: "text-lg font-semibold"
                }, "介護施設向け 検食シフト作成システム")
            ),
            React.createElement('div', {
                className: "flex flex-wrap items-center gap-2"
            },
                React.createElement('button', {
                    className: "px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200",
                    onClick: onOpenCSV
                }, "CSV出力 ▼"),
                React.createElement('button', {
                    className: "px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200",
                    onClick: onSave
                }, "保存"),
                React.createElement('button', {
                    className: "px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200",
                    onClick: onLoad
                }, "読込"),
                React.createElement('button', {
                    className: "px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700",
                    onClick: onAutoAssign
                }, "勤務シフト自動割当"),
                React.createElement('button', {
                    className: "px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700",
                    onClick: onAutoAssignKenshoku
                }, "検食ローテーション自動割当")
            )
        )
    );
}

// タブナビゲーション
function TabNavigation({ activeTab, onTabChange, year, month, onYearChange, onMonthChange }) {
    const today = new Date();
    const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 1 + i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const tabs = [
        { key: "shift", label: "勤務シフト" },
        { key: "kenshoku", label: "検食ローテーション" },
        { key: "staff", label: "スタッフ管理" },
        { key: "settings", label: "設定" }
    ];

    return React.createElement('div', {
        className: "flex flex-wrap items-center gap-3 mb-4"
    },
        React.createElement('div', {
            className: "flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2"
        },
            React.createElement('label', {
                className: "text-sm text-slate-600"
            }, "年"),
            React.createElement('select', {
                className: "outline-none bg-transparent",
                value: year,
                onChange: e => onYearChange(Number(e.target.value))
            }, years.map(y =>
                React.createElement('option', { key: y, value: y }, y)
            ))
        ),
        React.createElement('div', {
            className: "flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2"
        },
            React.createElement('label', {
                className: "text-sm text-slate-600"
            }, "月"),
            React.createElement('select', {
                className: "outline-none bg-transparent",
                value: month,
                onChange: e => onMonthChange(Number(e.target.value))
            }, months.map(m =>
                React.createElement('option', { key: m, value: m }, m)
            ))
        ),
        React.createElement('div', {
            className: "flex bg-white border border-slate-200 rounded-xl overflow-hidden"
        }, tabs.map(({ key, label }) =>
            React.createElement('button', {
                key: key,
                className: `px-4 py-2 text-sm transition-colors ${activeTab === key
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                    }`,
                onClick: () => onTabChange(key)
            }, label)
        ))
    );
}

// ダウンロードセンター
function DownloadCenter({ dl, onClose, onSelectType, onCopyToClipboard }) {
    if (!dl.visible) return null;

    return React.createElement('div', {
        className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    },
        React.createElement('div', {
            className: "bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        },
            React.createElement('div', {
                className: "flex items-center justify-between mb-4"
            },
                React.createElement('h3', {
                    className: "text-lg font-semibold"
                }, "CSV出力"),
                React.createElement('button', {
                    className: "text-slate-400 hover:text-slate-600",
                    onClick: onClose
                }, "✕")
            ),

            dl.kind === 'menu' ?
                React.createElement('div', {
                    className: "space-y-4"
                },
                    React.createElement('div', {
                        className: "text-sm text-slate-600 mb-4"
                    }, "出力形式を選択してください："),
                    React.createElement('div', {
                        className: "grid gap-3"
                    },
                        React.createElement('button', {
                            className: "p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left",
                            onClick: () => onSelectType('shift')
                        },
                            React.createElement('div', {
                                className: "font-medium"
                            }, "勤務シフト表"),
                            React.createElement('div', {
                                className: "text-sm text-slate-600"
                            }, "日付・役職・シフト・スロット・名前の形式")
                        ),
                        React.createElement('button', {
                            className: "p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left",
                            onClick: () => onSelectType('kenshoku')
                        },
                            React.createElement('div', {
                                className: "font-medium"
                            }, "検食ローテーション表"),
                            React.createElement('div', {
                                className: "text-sm text-slate-600"
                            }, "日付・食事・スロット・名前の形式")
                        ),
                        React.createElement('button', {
                            className: "p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left",
                            onClick: () => onSelectType('bystaff')
                        },
                            React.createElement('div', {
                                className: "font-medium"
                            }, "スタッフ別勤務表"),
                            React.createElement('div', {
                                className: "text-sm text-slate-600"
                            }, "名前・日付・役職・シフトの形式")
                        )
                    )
                ) :
                React.createElement('div', {
                    className: "space-y-4"
                },
                    React.createElement('div', null,
                        React.createElement('div', {
                            className: "text-sm text-slate-600 mb-2"
                        }, `ファイル名: ${dl.filename}`),
                        React.createElement('div', {
                            className: "text-sm text-slate-600 mb-2"
                        }, `サイズ: ${dl.text.length} 文字`)
                    ),
                    React.createElement('div', {
                        className: "flex flex-wrap gap-2"
                    },
                        React.createElement('a', {
                            href: dl.dataUrl,
                            download: dl.filename,
                            className: "px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        }, "📥 ダウンロード"),
                        React.createElement('button', {
                            className: "px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg",
                            onClick: onCopyToClipboard
                        }, "📋 クリップボードにコピー"),
                        React.createElement('button', {
                            className: "px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg",
                            onClick: () => onSelectType('menu')
                        }, "← 戻る")
                    ),
                    React.createElement('div', null,
                        React.createElement('div', {
                            className: "text-sm text-slate-600 mb-2"
                        }, "プレビュー:"),
                        React.createElement('pre', {
                            className: "bg-slate-50 p-3 rounded-lg text-xs overflow-x-auto max-h-60 overflow-y-auto"
                        },
                            dl.text.slice(0, 2000),
                            dl.text.length > 2000 && "\n... (省略)"
                        )
                    )
                )
        )
    );
}

// エクスポート
window.Components = {
    Header,
    TabNavigation,
    DownloadCenter
};