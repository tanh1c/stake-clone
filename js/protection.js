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

// Anti-debug và anti-devtools
(function() {
    setInterval(() => {
        const start = performance.now();
        debugger;
        const end = performance.now();
        if (end - start > 100) {
            window.location.href = '/error.html';
        }
    }, 1000);

    // Vô hiệu hóa right-click
    document.addEventListener('contextmenu', e => e.preventDefault());

    // Vô hiệu hóa phím tắt dev tools
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey && e.shiftKey && e.keyCode == 73) || // Ctrl+Shift+I
            (e.ctrlKey && e.shiftKey && e.keyCode == 74) || // Ctrl+Shift+J
            (e.keyCode == 123)) { // F12
            e.preventDefault();
        }
    });

    // Phát hiện dev tools
    let devtools = function() {};
    devtools.toString = function() {
        window.location.href = '/error.html';
    }
    console.log('%c', devtools);

    // Chống copy source
    document.addEventListener('selectstart', e => e.preventDefault());
    document.addEventListener('copy', e => e.preventDefault());
})(); 