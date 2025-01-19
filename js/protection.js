// Thêm protection script
(function() {
    // Vô hiệu hóa chuột phải
    document.addEventListener('contextmenu', e => e.preventDefault());

    // Vô hiệu hóa phím F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    document.addEventListener('keydown', function(e) {
        if (
            e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
            (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
        ) {
            e.preventDefault();
        }
    });

    // Vô hiệu hóa DevTools
    function detectDevTools() {
        const widthThreshold = window.outerWidth - window.innerWidth > 160;
        const heightThreshold = window.outerHeight - window.innerHeight > 160;
        
        if(widthThreshold || heightThreshold) {
            document.body.innerHTML = ''; // Xóa nội dung
            window.location.href = 'error.html'; // Chuyển hướng
        }
    }

    setInterval(detectDevTools, 1000);

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

})(); 