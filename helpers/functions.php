<?php
function e(?string $value): string { return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'); }
function money($amount): string { return number_format((float)$amount, 2) . ' ج.م'; }
function redirect(string $path): never { header('Location: ' . url($path)); exit; }
function url(string $path = ''): string { $base = rtrim($GLOBALS['config']['app']['base_url'] ?? '', '/'); return $base . '/' . ltrim($path, '/'); }
function asset(string $path): string { return url('assets/' . ltrim($path, '/')); }
function csrf_token(): string { if (empty($_SESSION['_csrf'])) $_SESSION['_csrf'] = bin2hex(random_bytes(32)); return $_SESSION['_csrf']; }
function csrf_field(): string { return '<input type="hidden" name="_csrf" value="' . e(csrf_token()) . '">'; }
function verify_csrf(): void { if ($_SERVER['REQUEST_METHOD'] === 'POST' && !hash_equals($_SESSION['_csrf'] ?? '', $_POST['_csrf'] ?? '')) { http_response_code(419); exit('CSRF token mismatch'); } }
function flash(string $key, ?string $message = null): ?string { if ($message !== null) { $_SESSION['_flash'][$key] = $message; return null; } $m = $_SESSION['_flash'][$key] ?? null; unset($_SESSION['_flash'][$key]); return $m; }
function current_user(): ?array { return $_SESSION['user'] ?? null; }
function is_staff(): bool { return in_array(current_user()['role'] ?? '', ['admin','manager'], true); }
function require_login(): void { if (!current_user()) redirect('/login'); }
function require_staff(): void { if (!is_staff()) redirect('/admin/login'); }
function slugify_ar(string $input): string { $s = trim(mb_strtolower($input, 'UTF-8')); $s = preg_replace('/[^\p{L}\p{N}]+/u', '-', $s); return trim(mb_substr($s, 0, 80, 'UTF-8'), '-') ?: bin2hex(random_bytes(4)); }
function weight_label(int $grams): string { return $grams >= 1000 ? ($grams / 1000) . ' كجم' : $grams . ' جم'; }
function price_for_weight(float $kgPrice, int $grams): float { return round(($kgPrice * $grams) / 1000, 2); }
function setting(string $key, $default = '') { return Setting::get($key, $default); }
function render(string $view, array $data = [], string $layout = 'layouts/site'): void { extract($data); ob_start(); require __DIR__ . '/../views/' . $view . '.php'; $content = ob_get_clean(); require __DIR__ . '/../views/' . $layout . '.php'; }
function upload_image(string $field, string $folder, ?string $old = null): ?string {
    if (empty($_FILES[$field]['name']) || $_FILES[$field]['error'] === UPLOAD_ERR_NO_FILE) return $old;
    if ($_FILES[$field]['error'] !== UPLOAD_ERR_OK) throw new RuntimeException('تعذر رفع الصورة');
    if ($_FILES[$field]['size'] > $GLOBALS['config']['app']['upload_max_bytes']) throw new RuntimeException('حجم الصورة كبير');
    $finfo = new finfo(FILEINFO_MIME_TYPE); $mime = $finfo->file($_FILES[$field]['tmp_name']);
    $exts = ['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif'];
    if (!isset($exts[$mime])) throw new RuntimeException('نوع الصورة غير مدعوم');
    $dir = __DIR__ . '/../uploads/' . $folder; if (!is_dir($dir)) mkdir($dir, 0755, true);
    $name = bin2hex(random_bytes(16)) . '.' . $exts[$mime];
    if (!move_uploaded_file($_FILES[$field]['tmp_name'], $dir . '/' . $name)) throw new RuntimeException('فشل حفظ الصورة');
    return 'uploads/' . $folder . '/' . $name;
}
