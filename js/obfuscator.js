const JavaScriptObfuscator = {
    // Hàm mã hóa code
    obfuscate(code) {
        return `
            (function(){
                // Chống debug
                setInterval(() => {
                    const start = new Date();
                    debugger;
                    const end = new Date();
                    if (end - start > 100) {
                        window.location.href = 'about:blank';
                    }
                }, 100);

                // Chống copy
                document.addEventListener('contextmenu', e => e.preventDefault());
                document.addEventListener('keydown', e => {
                    if (e.ctrlKey && (e.key === 'u' || e.key === 's')) {
                        e.preventDefault();
                        return false;
                    }
                });

                // Chống F12 
                document.addEventListener('keydown', e => {
                    if (e.key === 'F12') {
                        e.preventDefault();
                        return false;
                    }
                });

                // Mã hóa code chính
                const encoded = btoa(encodeURIComponent(code));
                return Function(decodeURIComponent(atob(encoded)))();
            })();
        `;
    }
}; 