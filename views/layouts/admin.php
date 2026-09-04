<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>إدارة <?= e(setting('store_name_ar')) ?></title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.rtl.min.css" rel="stylesheet"><link href="<?= asset('css/app.css') ?>" rel="stylesheet"></head><body class="admin-bg">
<?php $nav = ['/admin'=>'الرئيسية','/admin/products'=>'المنتجات','/admin/categories'=>'الأقسام','/admin/orders'=>'الطلبات','/admin/inventory'=>'المخزون','/admin/users'=>'المستخدمون','/admin/settings'=>'الإعدادات','/'=>'المتجر']; ?>
<header class="admin-topbar d-lg-none">
  <button class="btn btn-sm btn-outline-light admin-menu-btn" type="button" data-bs-toggle="offcanvas" data-bs-target="#adminNav" aria-controls="adminNav" aria-label="فتح قائمة الإدارة">☰ القائمة</button>
  <span class="fw-bold text-white text-truncate">لوحة الإدارة</span>
</header>
<div class="offcanvas offcanvas-end admin-side d-lg-none" tabindex="-1" id="adminNav" aria-label="قائمة الإدارة">
  <div class="offcanvas-header"><h5 class="offcanvas-title text-white">لوحة الإدارة</h5><button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="إغلاق"></button></div>
  <div class="offcanvas-body d-flex flex-column">
    <nav class="nav flex-column"><?php foreach($nav as $href=>$label): ?><a href="<?= url($href) ?>" class="nav-link"><?= e($label) ?></a><?php endforeach; ?></nav>
    <form method="post" action="<?= url('/logout') ?>" class="mt-3"><?= csrf_field() ?><button class="btn btn-outline-light btn-sm w-100">خروج</button></form>
  </div>
</div>
<div class="d-flex admin-shell">
  <aside class="admin-side p-3 d-none d-lg-flex flex-column"><h5 class="text-white">لوحة الإدارة</h5><nav class="nav flex-column"><?php foreach($nav as $href=>$label): ?><a href="<?= url($href) ?>" class="nav-link"><?= e($label) ?></a><?php endforeach; ?></nav><form method="post" action="<?= url('/logout') ?>" class="mt-3"><?= csrf_field() ?><button class="btn btn-outline-light btn-sm w-100">خروج</button></form></aside>
  <main id="main" class="flex-grow-1 min-w-0 p-3 p-lg-4"><?php foreach(['success','error'] as $k): if($m=flash($k)): ?><div class="alert alert-<?= $k==='success'?'success':'danger' ?>" role="alert" aria-live="polite"><?= e($m) ?></div><?php endif; endforeach; ?><?= $content ?></main>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script><script src="<?= asset('js/app.js') ?>"></script></body></html>
