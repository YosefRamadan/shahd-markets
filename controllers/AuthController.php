<?php
class AuthController extends BaseController
{
 public function loginForm(): void { $this->view('auth/login'); }
 public function login(): void { verify_csrf(); $u=(new User())->findByEmail(trim($_POST['email']??'')); if(!$u || !$u['is_active'] || !password_verify($_POST['password']??'', $u['password_hash'])){ flash('error','بيانات الدخول غير صحيحة'); redirect('/login'); } $this->signIn($u, !empty($_POST['remember'])); redirect(is_staff()?'/admin':'/account'); }
 public function adminLoginForm(): void { $this->view('auth/admin-login'); }
 public function adminLogin(): void { verify_csrf(); $u=(new User())->findByEmail(trim($_POST['email']??'')); if(!$u || !in_array($u['role'],['admin','manager'],true) || !password_verify($_POST['password']??'', $u['password_hash'])){ flash('error','غير مصرح'); redirect('/admin/login'); } $this->signIn($u,!empty($_POST['remember'])); redirect('/admin'); }
 private function signIn(array $u,bool $remember): void { session_regenerate_id(true); $_SESSION['user']=['id'=>$u['id'],'full_name'=>$u['full_name'],'email'=>$u['email'],'phone'=>$u['phone'],'role'=>$u['role'],'city'=>$u['city'],'default_address'=>$u['default_address']]; if($remember){$token=bin2hex(random_bytes(32)); (new User())->setRemember((int)$u['id'],password_hash($token,PASSWORD_DEFAULT)); setcookie($GLOBALS['config']['app']['remember_cookie'],$token,time()+60*60*24*30,'/','',!empty($_SERVER['HTTPS']),true);} }
 public function registerForm(): void { $this->view('auth/register'); }
 public function register(): void { verify_csrf(); $d=$_POST; if(!filter_var($d['email']??'',FILTER_VALIDATE_EMAIL) || strlen($d['password']??'')<8){ flash('error','تحقق من البريد وكلمة المرور'); redirect('/register'); } $id=(new User())->create($d); $u=(new User())->find($id); $this->signIn($u,false); redirect('/account'); }
 public function logout(): void { verify_csrf(); if(current_user()) (new User())->setRemember((int)current_user()['id'],null); setcookie($GLOBALS['config']['app']['remember_cookie'],'',time()-3600,'/'); $_SESSION=[]; session_destroy(); redirect('/'); }
 public function forgotForm(): void { $this->view('auth/forgot-password'); }
 public function forgot(): void { verify_csrf(); $u=(new User())->findByEmail(trim($_POST['email']??'')); if($u){$token=bin2hex(random_bytes(24)); (new User())->createReset((int)$u['id'],$token); flash('reset_link', url('/reset-password?token='.$token));} flash('success','إذا كان البريد مسجلاً فستظهر تعليمات إعادة التعيين.'); redirect('/forgot-password'); }
 public function resetForm(): void { $this->view('auth/reset-password',['token'=>$_GET['token']??'']); }
 public function reset(): void { verify_csrf(); if(strlen($_POST['password']??'')<8 || !(new User())->resetByToken($_POST['token']??'',$_POST['password'])){ flash('error','رابط غير صالح أو كلمة مرور قصيرة'); redirect('/reset-password'); } flash('success','تم تغيير كلمة المرور.'); redirect('/login'); }
}
