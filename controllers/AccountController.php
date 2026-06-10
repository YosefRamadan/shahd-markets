<?php
class AccountController extends BaseController
{
 public function index(): void { require_login(); $this->view('account/index'); }
 public function update(): void { require_login(); verify_csrf(); (new User())->update((int)current_user()['id'],$_POST); $_SESSION['user']=(new User())->find((int)current_user()['id']); flash('success','تم حفظ البيانات'); redirect('/account'); }
 public function orders(): void { require_login(); $this->view('account/orders',['orders'=>(new Order())->mine()]); }
}
