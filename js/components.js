// React コンポーネント群

// ヘッダーコンポーネント
function Header({ onAutoAssign, onAutoAssignKenshoku, onOpenCSV, onSaveSettingsCSV, onLoadSettingsCSV, onSaveAllDataCSV, onLoadAllDataCSV }) {
    return React.createElement('header', {
        className: "sticky top-0 z-10 glass-effect-strong"
    },
        React.createElement('div', {
            className: "mx-auto max-w-7xl px-4 py-3 flex items-center justify-between"
        },
            React.createElement('div', {
                className: "flex items-center gap-3"
            },
                React.createElement('div', {
                    className: "w-3 h-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 shadow-sm"
                }),
                React.createElement('h1', {
                    className: "text-lg font-semibold text-white"
                }, "介護施設向け 検食シフト作成システム")
            ),
            React.createElement('div', {
                className: "flex flex-wrap items-center gap-2"
            },
                // CSV出力メニュー
                React.createElement('button', {
                    className: "btn btn-secondary text-xs",
                    onClick: onOpenCSV
                }, "📊 CSV出力"),

                // CSV保存・読み込みグループ
                React.createElement('div', {
                    className: "flex items-center gap-1 bg-white/10 rounded-lg p-1"
                },
                    React.createElement('button', {
                        className: "px-2 py-1 text-xs rounded bg-green-500/80 text-white hover:bg-green-500 transition-smooth",
                        onClick: onSaveSettingsCSV,
                        title: "設定データをCSVファイルで保存"
                    }, "📤 設定保存"),
                    React.createElement('button', {
                        className: "px-2 py-1 text-xs rounded bg-blue-500/80 text-white hover:bg-blue-500 transition-smooth",
                        onClick: onLoadSettingsCSV,
                        title: "CSVファイルから設定データを読み込み"
                    }, "📤 設定存読込"),
                    React.createElement('button', {
                        className: "px-2 py-1 text-xs rounded bg-purple-500/80 text-white hover:bg-purple-500 transition-smooth",
                        onClick: onSaveAllDataCSV,
                        title: "全データ（設定+シフト+検食）をCSVファイルで保存"
                    }, "📤 全保存"),
                    React.createElement('button', {
                        className: "px-2 py-1 text-xs rounded bg-orange-500/80 text-white hover:bg-orange-500 transition-smooth",
                        onClick: onLoadAllDataCSV,
                        title: "CSVファイルから全データを読み込み"
                    }, "📤 全読込)")
                ),

                // 自動割当ボタン
                React.createElement('button', {
                    className: "btn btn-primary text-xs",
                    onClick: onAutoAssign
                }, "✨ 勤務シフト自動割当"),
                React.createElement('button', {
                    className: "px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 text-xs transition-smooth",
                    onClick: onAutoAssignKenshoku
                }, "🍽️ 検食ローテーション自動割当")
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
                        ),
                        React.createElement('button', {
                            className: "p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left",
                            onClick: () => onSelectType('settings')
                        },
                            React.createElement('div', {
                                className: "font-medium"
                            }, "設定データ"),
                            React.createElement('div', {
                                className: "text-sm text-slate-600"
                            }, "スタッフ情報・シフト要件・検食設定の形式")
                        ),
                        React.createElement('button', {
                            className: "p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left",
                            onClick: () => onSelectType('complete')
                        },
                            React.createElement('div', {
                                className: "font-medium"
                            }, "完全データ"),
                            React.createElement('div', {
                                className: "text-sm text-slate-600"
                            }, "設定+シフト+検食データの統合形式")
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

// 検索可能なセレクトコンポーネント
function SearchableSelect({
    value,
    onChange,
    options,
    placeholder = "選択してください",
    emptyText = "未割当",
    className = "",
    disabled = false
}) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const containerRef = React.useRef(null);
    const inputRef = React.useRef(null);

    // 検索でフィルタリングされたオプション
    const filteredOptions = React.useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(option =>
            option.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    // 選択されたオプションの表示テキスト
    const displayValue = value || emptyText;

    // 外部クリックでドロップダウンを閉じる
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // キーボードナビゲーション
    const handleKeyDown = (event) => {
        if (disabled) return;

        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                if (isOpen && highlightedIndex >= 0) {
                    const selectedOption = filteredOptions[highlightedIndex];
                    onChange(selectedOption);
                    setIsOpen(false);
                    setSearchTerm('');
                    setHighlightedIndex(-1);
                } else if (!isOpen) {
                    setIsOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 0);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchTerm('');
                setHighlightedIndex(-1);
                break;
            case 'ArrowDown':
                event.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 0);
                } else {
                    setHighlightedIndex(prev =>
                        prev < filteredOptions.length - 1 ? prev + 1 : prev
                    );
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (isOpen) {
                    setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
                }
                break;
            case 'Tab':
                if (isOpen) {
                    setIsOpen(false);
                    setSearchTerm('');
                    setHighlightedIndex(-1);
                }
                break;
        }
    };

    const handleInputChange = (event) => {
        const newValue = event.target.value;
        setSearchTerm(newValue);
        setHighlightedIndex(-1);

        // 直接入力での選択も可能にする
        if (options.includes(newValue)) {
            onChange(newValue);
        } else if (newValue === '') {
            onChange('');
        }
    };

    const handleOptionClick = (option) => {
        onChange(option);
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
    };

    const handleToggle = () => {
        if (disabled) return;

        if (!isOpen) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
        } else {
            setIsOpen(false);
            setSearchTerm('');
            setHighlightedIndex(-1);
        }
    };

    const handleClear = (event) => {
        event.stopPropagation();
        onChange('');
        setSearchTerm('');
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    return React.createElement('div', {
        ref: containerRef,
        className: `relative ${className}`,
        onKeyDown: handleKeyDown
    },
        // メインの入力エリア
        React.createElement('div', {
            className: `
                w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent 
                transition-smooth cursor-pointer bg-white card-interactive
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300 hover:shadow-sm'}
                ${isOpen ? 'ring-2 ring-primary-500 border-transparent shadow-md' : ''}
            `,
            onClick: handleToggle
        },
            React.createElement('div', {
                className: "flex items-center justify-between"
            },
                // 表示値または検索入力
                isOpen ?
                    React.createElement('input', {
                        ref: inputRef,
                        type: 'text',
                        value: searchTerm,
                        onChange: handleInputChange,
                        placeholder: `${placeholder}を検索...`,
                        className: "flex-1 outline-none bg-transparent",
                        disabled: disabled,
                        onClick: (e) => e.stopPropagation()
                    }) :
                    React.createElement('span', {
                        className: `flex-1 ${!value ? 'text-slate-400' : 'text-slate-900'}`
                    }, displayValue),

                // アクションボタン
                React.createElement('div', {
                    className: "flex items-center gap-1"
                },
                    // クリアボタン
                    value && !disabled && React.createElement('button', {
                        type: 'button',
                        onClick: handleClear,
                        className: "p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors",
                        'aria-label': 'クリア'
                    }, '✕'),

                    // ドロップダウン矢印
                    React.createElement('div', {
                        className: `transition-transform ${isOpen ? 'rotate-180' : ''}`
                    }, '▼')
                )
            )
        ),

        // ドロップダウンリスト
        isOpen && React.createElement('div', {
            className: `
                absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 
                rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto fade-in
                backdrop-blur-sm
            `
        },
            // 空のオプション
            React.createElement('div', {
                className: `
                    px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 text-slate-400
                    ${highlightedIndex === -1 ? 'bg-primary-50 text-primary-700' : ''}
                `,
                onClick: () => handleOptionClick('')
            }, `👤 ${emptyText}`),

            // フィルタリングされたオプション
            filteredOptions.length > 0 ?
                filteredOptions.map((option, index) =>
                    React.createElement('div', {
                        key: option,
                        className: `
                            px-3 py-2 text-sm cursor-pointer hover:bg-slate-50
                            ${highlightedIndex === index ? 'bg-primary-50 text-primary-700' : 'text-slate-900'}
                            ${value === option ? 'bg-primary-100 text-primary-800 font-medium' : ''}
                        `,
                        onClick: () => handleOptionClick(option)
                    }, option)
                ) :
                searchTerm && React.createElement('div', {
                    className: "px-3 py-2 text-sm text-slate-400 italic"
                }, '該当するスタッフが見つかりません')
        )
    );
}

// エクスポート
window.Components = {
    Header,
    TabNavigation,
    DownloadCenter,
    SearchableSelect
};