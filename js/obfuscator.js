// Hàm mã hóa đơn giản
function obfuscateCode(code) {
    return btoa(encodeURIComponent(code)); // Mã hóa base64 
}

// Hàm giải mã
function deobfuscateCode(encoded) {
    return decodeURIComponent(atob(encoded)); // Giải mã base64
} 