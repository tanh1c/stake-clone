// Protection script - đặt ở đầu file
(function() {
    // Chặn ngay khi script được load
    if (window.devtools.isOpen) {
        blockAccess();
    }
    
    // Hàm chặn truy cập
    function blockAccess() {
        // Xóa toàn bộ nội dung
        document.documentElement.innerHTML = '';
        
        // Chuyển hướng và chặn quay lại
        window.location.replace('error.html');
        history.pushState(null, '', 'error.html');
        window.addEventListener('popstate', function() {
            history.pushState(null, '', 'error.html');
        });
        
        // Xóa localStorage
        localStorage.clear();
        
        // Ngăn chặn việc load lại trang
        window.onbeforeunload = () => false;
    }

    // DevTools detection
    const devtools = {
        isOpen: false,
        orientation: undefined
    };
    
    // Theo dõi liên tục
    setInterval(() => {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            devtools.isOpen = true;
            blockAccess();
        }
        
        // Debugger trap
        const start = performance.now();
        debugger;
        const end = performance.now();
        if ((end - start) > 100) {
            devtools.isOpen = true;
            blockAccess();
        }
    }, 1000);

    // Chặn phím tắt
    window.addEventListener('keydown', function(e) {
        if (
            e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
            (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
        ) {
            e.preventDefault();
            blockAccess();
        }
    }, true);

    // Chặn chuột phải
    window.addEventListener('contextmenu', e => {
        e.preventDefault();
        blockAccess();
    }, true);

    // Obfuscate code ngay khi load
    const scripts = document.getElementsByTagName('script');
    for(let script of scripts) {
        if(script.src && !script.src.includes('protection.js')) {
            const code = fetch(script.src)
                .then(r => r.text())
                .then(code => {
                    script.textContent = btoa(encodeURIComponent(code));
                    script.removeAttribute('src');
                });
        }
    }

    // Mã hóa source code
    function obfuscateJS() {
        const scripts = document.getElementsByTagName('script');
        for(let script of scripts) {
            if(script.src && !script.src.includes('protection.js')) {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', script.src, false);
                xhr.send();
                
                if(xhr.status === 200) {
                    const obfuscated = _obfuscate(xhr.responseText);
                    const newScript = document.createElement('script');
                    newScript.type = 'text/javascript';
                    newScript.text = obfuscated;
                    script.parentNode.replaceChild(newScript, script);
                }
            }
        }
    }

    // Hàm mã hóa code
    function _obfuscate(code) {
        return `
            (function(){
                const _0x${Math.random().toString(36).substr(2, 9)}=${JSON.stringify(code)};
                eval(decodeURIComponent(escape(atob(_0x${Math.random().toString(36).substr(2, 9)}))));
            })();
        `;
    }

    // Thêm watermark
    const watermark = document.createElement('div'); 
    watermark.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 72px;
        color: rgba(255,255,255,0.1);
        pointer-events: none;
        user-select: none;
        z-index: 9999;
        white-space: nowrap;
    `;
    watermark.textContent = 'PROTECTED';
    document.body.appendChild(watermark);

    // Obfuscate all JS files
    function obfuscateAllJS() {
        const scripts = document.getElementsByTagName('script');
        
        for(let script of scripts) {
            if(script.src && !script.src.includes('protection.js')) {
                fetch(script.src)
                    .then(response => response.text())
                    .then(code => {
                        // Obfuscate code
                        const obfuscated = `
                            (function(){
                                const _${Math.random().toString(36).substr(2,9)} = 
                                    "${btoa(encodeURIComponent(code))}";
                                eval(decodeURIComponent(atob(_${Math.random().toString(36).substr(2,9)})));
                            })();
                        `;
                        
                        // Replace original script with obfuscated version
                        const newScript = document.createElement('script');
                        newScript.type = 'text/javascript';
                        newScript.textContent = obfuscated;
                        script.parentNode.replaceChild(newScript, script);
                    });
            }
        }
        
        // Remove source map comments
        document.querySelectorAll('script').forEach(script => {
            if(script.textContent) {
                script.textContent = script.textContent.replace(/\/\/#\s*sourceMappingURL.*/g, '');
            }
        });
    }

    // Run obfuscation when page loads
    document.addEventListener('DOMContentLoaded', obfuscateAllJS);

})(); 