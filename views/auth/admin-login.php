<div class="container py-5" style="max-width:520px">
  <h1 class="h3">دخول الإدارة</h1>
  <form method="post" class="card card-body"><?= csrf_field() ?>
    <label class="form-label" for="a-email">بريد المدير</label>
    <input id="a-email" name="email" type="email" inputmode="email" autocomplete="username" required class="form-control mb-3">
    <label class="form-label" for="a-pass">كلمة المرور</label>
    <input id="a-pass" name="password" type="password" autocomplete="current-password" required class="form-control mb-3">
    <div class="form-check mb-3"><input class="form-check-input" type="checkbox" id="a-remember" name="remember"><label class="form-check-label" for="a-remember">تذكرني</label></div>
    <button class="btn btn-dark">دخول</button>
  </form>
</div>
