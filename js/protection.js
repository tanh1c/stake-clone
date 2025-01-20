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
            // Chặn debug bằng performance check
            setInterval(() => {
                debugger;
                const start = performance.now();
                debugger;
                const end = performance.now();
                
                if(end - start > 100) {
                    this.handleDevToolsOpen();
                }
            }, 1000);

            // Chặn debug bằng console.log timing
            const checkConsole = () => {
                const before = performance.now();
                console.log('Check');
                console.clear();
                const after = performance.now();
                if (after - before > 100) {
                    this.handleDevToolsOpen();
                }
            };
            setInterval(checkConsole, 1000);

            // Vô hiệu hóa tất cả phím tắt dev tools
            document.addEventListener('keydown', e => {
                const cmdOrCtrl = e.ctrlKey || e.metaKey; // metaKey cho macOS
                
                // Danh sách các phím tắt cần chặn
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

            // Chặn các thuộc tính debug
            Object.defineProperty(window, 'console', {
                get: () => {
                    this.handleDevToolsOpen();
                    return {};
                }
            });

            // Theo dõi kích thước cửa sổ để phát hiện dev tools
            const threshold = window.outerWidth - window.innerWidth > 160;
            window.addEventListener('resize', () => {
                if (window.outerWidth - window.innerWidth > 160) {
                    this.handleDevToolsOpen();
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