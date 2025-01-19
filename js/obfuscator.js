const JavaScriptObfuscator = {
    // Hàm mã hóa code
    obfuscate(code) {
        try {
            // Mã hóa code bằng base64 và thêm một số nhiễu
            const salt = Math.random().toString(36).substring(7);
            const encoded = btoa(encodeURIComponent(code + salt));
            
            return `
                (function(){
                    try {
                        // Anti-debug
                        const debug = function() {
                            debugger;
                        };
                        setInterval(debug, 100);
                        
                        // Chống copy
                        document.addEventListener('contextmenu', e => e.preventDefault());
                        
                        // Chống F12
                        document.addEventListener('keydown', e => {
                            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                                e.preventDefault();
                                return false;
                            }
                        });
                        
                        // Giải mã và thực thi code
                        const decoded = decodeURIComponent(atob('${encoded}'.slice(0, -salt.length)));
                        eval(decoded);
                    } catch(e) {
                        console.warn('Loading error');
                    }
                })();
            `;
        } catch(e) {
            return code; // Fallback to original code if obfuscation fails
        }
    }
}; 