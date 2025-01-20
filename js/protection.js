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

        // Anti debug và dev tools
        initProtection() {
            // Chặn debug
            setInterval(() => {
                debugger;
                const start = performance.now();
                debugger;
                const end = performance.now();
                
                if(end - start > 100) {
                    // Xóa code và chuyển trang
                    document.body.innerHTML = '';
                    window.location.replace('error.html');
                }
            }, 1000);

            // Vô hiệu hóa developer tools
            document.addEventListener('keydown', e => {
                if(e.key === 'F12' || 
                   (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
                   (e.ctrlKey && e.key === 'U')) {
                    e.preventDefault();
                }
            });

            // Vô hiệu hóa chuột phải
            document.addEventListener('contextmenu', e => e.preventDefault());
        }
    };

    // Khởi tạo protection khi load trang
    document.addEventListener('DOMContentLoaded', () => {
        GameProtection.initProtection();
        GameProtection.obfuscateGames();
    });
})(); 