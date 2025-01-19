const JavaScriptObfuscator = {
    // Hàm mã hóa code
    obfuscate(code) {
        try {
            // Mã hóa cơ bản bằng base64
            const encoded = btoa(encodeURIComponent(code));
            
            return `
                (function(){
                    try {
                        // Giải mã và thực thi code
                        const decoded = decodeURIComponent(atob("${encoded}"));
                        eval(decoded);
                    } catch(e) {
                        console.warn('Script loading error');
                    }
                })();
            `;
        } catch(e) {
            return code; // Fallback nếu mã hóa thất bại
        }
    }
}; 