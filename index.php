<?php
require __DIR__ . '/config/bootstrap.php';
require_once __DIR__ . '/config/database.php';
if (!current_user() && !empty($_COOKIE[$GLOBALS['config']['app']['remember_cookie']])) {
    $u=(new User())->findByRemember($_COOKIE[$GLOBALS['config']['app']['remember_cookie']]);
    if($u){ session_regenerate_id(true); $_SESSION['user']=['id'=>$u['id'],'full_name'=>$u['full_name'],'email'=>$u['email'],'phone'=>$u['phone'],'role'=>$u['role'],'city'=>$u['city'],'default_address'=>$u['default_address']]; }
}
$method=$_SERVER['REQUEST_METHOD']; $path=parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH); $base=dirname($_SERVER['SCRIPT_NAME']); if($base !== '/' && str_starts_with($path,$base)) $path=substr($path,strlen($base)); $path='/' . trim($path,'/'); if($path==='//')$path='/';
function route(string $m,string $pattern,callable $handler): bool { global $method,$path; if($m!==$method)return false; $rx=preg_replace('#\{[a-zA-Z_]+\}#','([^/]+)',$pattern); if(preg_match('#^'.$rx.'$#',$path,$matches)){array_shift($matches); $handler(...array_map('urldecode',$matches)); return true;} return false; }
try {
if (route('GET','/', fn()=> (new HomeController())->index())) return;
if (route('GET','/categories', fn()=> (new HomeController())->categories())) return;
if (route('GET','/categories/{slug}', fn($slug)=> (new HomeController())->category($slug))) return;
if (route('GET','/products/{slug}', fn($slug)=> (new HomeController())->product($slug))) return;
if (route('GET','/cart', fn()=> (new CartController())->show())) return;
if (route('POST','/cart/add', fn()=> (new CartController())->add())) return;
if (route('POST','/cart/update', fn()=> (new CartController())->update())) return;
if (route('POST','/cart/remove', fn()=> (new CartController())->remove())) return;
if (route('GET','/checkout', fn()=> (new CheckoutController())->form())) return;
if (route('POST','/checkout', fn()=> (new CheckoutController())->submit())) return;
if (route('GET','/orders/{id}', fn($id)=> (new CheckoutController())->order((int)$id))) return;
if (route('GET','/login', fn()=> (new AuthController())->loginForm())) return;
if (route('POST','/login', fn()=> (new AuthController())->login())) return;
if (route('GET','/register', fn()=> (new AuthController())->registerForm())) return;
if (route('POST','/register', fn()=> (new AuthController())->register())) return;
if (route('POST','/logout', fn()=> (new AuthController())->logout())) return;
if (route('GET','/forgot-password', fn()=> (new AuthController())->forgotForm())) return;
if (route('POST','/forgot-password', fn()=> (new AuthController())->forgot())) return;
if (route('GET','/reset-password', fn()=> (new AuthController())->resetForm())) return;
if (route('POST','/reset-password', fn()=> (new AuthController())->reset())) return;
if (route('GET','/account', fn()=> (new AccountController())->index())) return;
if (route('POST','/account', fn()=> (new AccountController())->update())) return;
if (route('GET','/account/orders', fn()=> (new AccountController())->orders())) return;
if (route('GET','/admin/login', fn()=> (new AuthController())->adminLoginForm())) return;
if (route('POST','/admin/login', fn()=> (new AuthController())->adminLogin())) return;
if (route('GET','/admin', fn()=> (new AdminController())->dashboard())) return;
if (route('GET','/admin/categories', fn()=> (new AdminController())->categories())) return;
if (route('POST','/admin/categories/save', fn()=> (new AdminController())->saveCategory())) return;
if (route('POST','/admin/categories/delete', fn()=> (new AdminController())->deleteCategory())) return;
if (route('GET','/admin/products', fn()=> (new AdminController())->products())) return;
if (route('POST','/admin/products/save', fn()=> (new AdminController())->saveProduct())) return;
if (route('POST','/admin/products/delete', fn()=> (new AdminController())->deleteProduct())) return;
if (route('GET','/admin/orders', fn()=> (new AdminController())->orders())) return;
if (route('GET','/admin/orders/{id}', fn($id)=> (new AdminController())->order((int)$id))) return;
if (route('POST','/admin/orders/update', fn()=> (new AdminController())->updateOrder())) return;
if (route('GET','/admin/orders/{id}/invoice', fn($id)=> (new AdminController())->invoice((int)$id))) return;
if (route('GET','/admin/inventory', fn()=> (new AdminController())->inventory())) return;
if (route('GET','/admin/users', fn()=> (new AdminController())->users())) return;
if (route('POST','/admin/users/save', fn()=> (new AdminController())->saveUser())) return;
if (route('GET','/admin/settings', fn()=> (new AdminController())->settings())) return;
if (route('POST','/admin/settings', fn()=> (new AdminController())->saveSettings())) return;
http_response_code(404); render('pages/not-found');
} catch (PDOException $e) { http_response_code(500); echo '<h1 dir="rtl">خطأ اتصال قاعدة البيانات</h1><p dir="rtl">راجع ملف config/config.php واستيراد database/schema.sql.</p>'; }
