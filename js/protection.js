// Thêm protection script
(function() {
    // Tạo namespace riêng để tránh conflict
    const GameProtection = {
        // Mã hóa code game bằng nhiều lớp
        encodeGameCode(code) {
            // Thêm nhiễu
            const noise = Math.random().toString(36).substring(7);
            // Mã hóa nhiều lớp
            const encoded = btoa(encodeURIComponent(code))
                .split('')
                .reverse()
                .join('');
            return `${noise}${encoded}${noise}`;
        },

        // Giải mã code game
        decodeGameCode(encoded) {
            // Loại bỏ nhiễu
            const code = encoded.substring(5, encoded.length - 5)
                .split('')
                .reverse()
                .join('');
            return decodeURIComponent(atob(code));
        },

        // Obfuscate tất cả file game JS
        obfuscateGames() {
            const gameScripts = document.querySelectorAll('script[src*="/js/"]');
            
            gameScripts.forEach(script => {
                if(!script.src.includes('protection.js')) {
                    fetch(script.src)
                        .then(response => response.text())
                        .then(code => {
                            // Tạo wrapper function với tên random
                            const wrappedCode = `
                                (function ${Math.random().toString(36).substring(7)}(){
                                    const _${Math.random().toString(36).substring(7)} = 
                                        "${this.encodeGameCode(code)}";
                                    
                                    const _${Math.random().toString(36).substring(7)} = 
                                        function(c) { return GameProtection.decodeGameCode(c); };
                                        
                                    eval(_${Math.random().toString(36).substring(7)}(_${Math.random().toString(36).substring(7)}));
                                })();
                            `;
                            
                            // Thay thế script gốc
                            const newScript = document.createElement('script');
                            newScript.type = 'text/javascript';
                            newScript.textContent = wrappedCode;
                            script.parentNode.replaceChild(newScript, script);
                        });
                }
            });
        },

        // Anti debug và dev tools được cập nhật
        initProtection() {
            let devToolsCounter = 0;
            const maxAttempts = 3;

            // Chặn debug bằng performance check
            const debugCheck = () => {
                const start = performance.now();
                debugger;
                const end = performance.now();
                const diff = end - start;
                
                if(diff > 200) { // Tăng ngưỡng lên để tránh false positive
                    devToolsCounter++;
                    if(devToolsCounter >= maxAttempts) {
                        this.handleDevToolsOpen();
                    }
                }
            };
            setInterval(debugCheck, 1000);

            // Vô hiệu hóa tất cả phím tắt dev tools
            document.addEventListener('keydown', e => {
                const cmdOrCtrl = e.ctrlKey || e.metaKey;
                
                const blocked = [
                    // Windows/Linux
                    e.key === 'F12',
                    cmdOrCtrl && e.shiftKey && (e.key === 'I' || e.key === 'i'),
                    cmdOrCtrl && e.shiftKey && (e.key === 'J' || e.key === 'j'),
                    cmdOrCtrl && e.shiftKey && (e.key === 'C' || e.key === 'c'),
                    cmdOrCtrl && (e.key === 'U' || e.key === 'u'),
                    // macOS
                    cmdOrCtrl && e.altKey && (e.key === 'I' || e.key === 'i'),
                    cmdOrCtrl && e.altKey && (e.key === 'J' || e.key === 'j'),
                    cmdOrCtrl && e.altKey && (e.key === 'C' || e.key === 'c'),
                    // Firefox
                    e.key === 'F12' && e.shiftKey,
                    cmdOrCtrl && e.shiftKey && e.key === 'K',
                    // Safari
                    cmdOrCtrl && e.altKey && (e.key === 'U' || e.key === 'u'),
                    // Opera
                    cmdOrCtrl && e.shiftKey && e.key === 'Escape'
                ];

                if (blocked.includes(true)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }, true);

            // Vô hiệu hóa chuột phải
            document.addEventListener('contextmenu', e => {
                e.preventDefault();
                return false;
            });

            // Theo dõi kích thước cửa sổ để phát hiện dev tools
            let resizeCounter = 0;
            window.addEventListener('resize', () => {
                const widthDiff = window.outerWidth - window.innerWidth;
                if (widthDiff > 200) { // Tăng ngưỡng lên
                    resizeCounter++;
                    if(resizeCounter >= 2) { // Yêu cầu nhiều lần phát hiện
                        this.handleDevToolsOpen();
                    }
                } else {
                    resizeCounter = 0;
                }
            });
        },

        // Xử lý khi phát hiện dev tools
        handleDevToolsOpen() {
            // Xóa nội dung
            document.documentElement.innerHTML = '';
            
            // Xóa cache và storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Chặn back button
            history.pushState(null, '', 'error.html');
            window.addEventListener('popstate', () => {
                history.pushState(null, '', 'error.html');
            });
            
            // Chuyển đến trang error
            window.location.replace('error.html');
        }
    };

    // Khởi tạo protection khi load trang
    document.addEventListener('DOMContentLoaded', () => {
        GameProtection.initProtection();
        GameProtection.obfuscateGames();
    });
})();

// Anti-debug và anti-devtools protection
(function() {
    const GameProtection = {
        originalScripts: {},
        checksumInterval: null,

        // Khởi tạo protection
        init() {
            this.saveOriginalScripts();
            this.initDevToolsDetection();
            this.initScriptProtection();
            this.initEventListeners();
        },

        // Lưu trữ nội dung gốc của scripts
        saveOriginalScripts() {
            const scripts = document.getElementsByTagName('script');
            for (let script of scripts) {
                if (script.src) {
                    fetch(script.src)
                        .then(response => response.text())
                        .then(content => {
                            this.originalScripts[script.src] = this.generateChecksum(content);
                        });
                }
            }
        },

        // Tạo checksum cho script content
        generateChecksum(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash;
        },

        // Kiểm tra sự thay đổi của scripts
        checkScriptIntegrity() {
            const scripts = document.getElementsByTagName('script');
            for (let script of scripts) {
                if (script.src && this.originalScripts[script.src]) {
                    fetch(script.src)
                        .then(response => response.text())
                        .then(content => {
                            const currentChecksum = this.generateChecksum(content);
                            if (currentChecksum !== this.originalScripts[script.src]) {
                                this.handleTampering();
                            }
                        });
                }
            }
        },

        // Cập nhật phát hiện dev tools cho cả MacOS
        initDevToolsDetection() {
            const threshold = 160;
            let devtools = { isOpen: false, orientation: undefined };

            // Phát hiện qua kích thước cửa sổ
            setInterval(() => {
                const widthThreshold = window.outerWidth - window.innerWidth > threshold;
                const heightThreshold = window.outerHeight - window.innerHeight > threshold;
                
                if (widthThreshold || heightThreshold) {
                    if (!devtools.isOpen) {
                        devtools.isOpen = true;
                        devtools.orientation = widthThreshold ? 'vertical' : 'horizontal';
                        this.handleDevToolsOpen();
                    }
                }
            }, 500);

            // Phát hiện thông qua console.log
            const detectDevTools = () => {
                const date = new Date();
                debugger;
                return date.getTime() - date.getTime() > 100;
            };

            // Kiểm tra định kỳ
            setInterval(() => {
                if (detectDevTools()) {
                    this.handleDevToolsOpen();
                }
            }, 1000);

            // Phát hiện Firebug
            if (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) {
                this.handleDevToolsOpen();
            }

            // Phát hiện __REACT_DEVTOOLS_GLOBAL_HOOK__
            if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
                this.handleDevToolsOpen();
            }
        },

        // Bảo vệ script execution
        initScriptProtection() {
            // Override eval
            const originalEval = window.eval;
            window.eval = (...args) => {
                this.handleTampering();
                return originalEval.apply(window, args);
            };

            // Chặn new Function
            const originalFunction = window.Function;
            window.Function = (...args) => {
                this.handleTampering();
                return originalFunction.apply(window, args);
            };
        },

        // Cập nhật event listeners cho cả MacOS
        initEventListeners() {
            // Chặn right-click
            document.addEventListener('contextmenu', e => e.preventDefault());

            // Chặn phím tắt dev tools cho cả Windows và MacOS
            document.addEventListener('keydown', e => {
                // Windows shortcuts
                if ((e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
                    (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
                    (e.keyCode === 123)) { // F12
                    e.preventDefault();
                    this.handleDevToolsOpen();
                }

                // MacOS shortcuts
                if ((e.metaKey && e.altKey && e.keyCode === 73) || // Cmd+Alt+I
                    (e.metaKey && e.altKey && e.keyCode === 74) || // Cmd+Alt+J
                    (e.metaKey && e.altKey && e.keyCode === 67) || // Cmd+Alt+C
                    (e.metaKey && e.shiftKey && e.keyCode === 67)) { // Cmd+Shift+C
                    e.preventDefault();
                    this.handleDevToolsOpen();
                }
            });

            // Chặn copy/paste
            document.addEventListener('copy', e => e.preventDefault());
            document.addEventListener('paste', e => e.preventDefault());

            // Chặn Command + R (MacOS reload)
            document.addEventListener('keydown', e => {
                if (e.metaKey && e.keyCode === 82) {
                    e.preventDefault();
                }
            });
        },

        // Thêm phát hiện Safari Web Inspector
        detectSafariDevTools() {
            try {
                if (window.localStorage.getItem('devtools')) {
                    this.handleDevToolsOpen();
                }
            } catch (e) {
                // Safari private mode throws error
                this.handleDevToolsOpen();
            }
        },

        // Xử lý khi phát hiện dev tools
        handleDevToolsOpen() {
            this.clearPage();
            this.redirectToError();
        },

        // Xử lý khi phát hiện chỉnh sửa script
        handleTampering() {
            this.clearPage();
            this.redirectToError();
        },

        // Xóa nội dung trang
        clearPage() {
            document.documentElement.innerHTML = '';
            localStorage.clear();
            sessionStorage.clear();
        },

        // Chuyển hướng đến trang error
        redirectToError() {
            history.pushState(null, '', 'error.html');
            window.addEventListener('popstate', () => {
                history.pushState(null, '', 'error.html');
            });
            window.location.replace('error.html');
        }
    };

    // Khởi tạo protection
    GameProtection.init();
})(); 