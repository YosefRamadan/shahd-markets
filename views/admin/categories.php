<h1>الأقسام</h1>
<form method="post" enctype="multipart/form-data" action="<?= url('/admin/categories/save') ?>" class="card card-body mb-4">
  <?= csrf_field() ?>
  <h2 class="h6 mb-3">إضافة قسم جديد</h2>
  <div class="row g-3">
    <div class="col-12 col-md-4"><label class="form-label" for="c-name">اسم القسم</label><input id="c-name" name="name_ar" class="form-control" required></div>
    <div class="col-12 col-md-4"><label class="form-label" for="c-slug">الرابط (اختياري)</label><input id="c-slug" name="slug" class="form-control"></div>
    <div class="col-6 col-md-2"><label class="form-label" for="c-sort">الترتيب</label><input id="c-sort" name="sort_order" type="number" class="form-control" value="0"></div>
    <div class="col-6 col-md-2"><label class="form-label" for="c-img">الصورة</label><input id="c-img" type="file" name="image" accept="image/*" class="form-control"></div>
    <div class="col-12 d-flex flex-wrap gap-3 align-items-center">
      <div class="form-check"><input class="form-check-input" type="checkbox" id="c-active" name="is_active" checked><label class="form-check-label" for="c-active">نشط</label></div>
      <button class="btn btn-success ms-auto">إضافة القسم</button>
    </div>
  </div>
</form>

<h2 class="h6 mb-2">الأقسام الحالية</h2>
<?php foreach($categories as $c): ?>
  <form id="cat-<?= $c['id'] ?>" method="post" enctype="multipart/form-data" action="<?= url('/admin/categories/save') ?>" class="d-none"><?= csrf_field() ?><input type="hidden" name="id" value="<?= $c['id'] ?>"></form>
  <form id="catdel-<?= $c['id'] ?>" method="post" action="<?= url('/admin/categories/delete') ?>" class="d-none"><?= csrf_field() ?><input type="hidden" name="id" value="<?= $c['id'] ?>"></form>
<?php endforeach; ?>

<div class="d-grid gap-3">
<?php foreach($categories as $c): $f='cat-'.$c['id']; ?>
  <div class="card card-body">
    <div class="row g-3 align-items-end">
      <div class="col-4 col-md-2">
        <img src="<?= e($c['image_url'] ? url($c['image_url']) : 'https://placehold.co/80x80?text=Cat') ?>" width="64" height="64" class="rounded mb-2" alt="صورة قسم <?= e($c['name_ar']) ?>">
        <label class="form-label" for="ci-<?= $c['id'] ?>">تغيير الصورة</label>
        <input id="ci-<?= $c['id'] ?>" form="<?= $f ?>" type="file" name="image" accept="image/*" class="form-control form-control-sm">
      </div>
      <div class="col-8 col-md-3"><label class="form-label" for="cn-<?= $c['id'] ?>">الاسم</label><input id="cn-<?= $c['id'] ?>" form="<?= $f ?>" name="name_ar" class="form-control" value="<?= e($c['name_ar']) ?>"></div>
      <div class="col-12 col-md-3"><label class="form-label" for="cs-<?= $c['id'] ?>">الرابط</label><input id="cs-<?= $c['id'] ?>" form="<?= $f ?>" name="slug" class="form-control" value="<?= e($c['slug']) ?>"></div>
      <div class="col-6 col-md-2"><label class="form-label" for="co-<?= $c['id'] ?>">الترتيب</label><input id="co-<?= $c['id'] ?>" form="<?= $f ?>" name="sort_order" type="number" class="form-control" value="<?= (int)$c['sort_order'] ?>"></div>
      <div class="col-6 col-md-2">
        <div class="form-check mb-2"><input class="form-check-input" form="<?= $f ?>" type="checkbox" id="ca-<?= $c['id'] ?>" name="is_active" <?= $c['is_active']?'checked':'' ?>><label class="form-check-label" for="ca-<?= $c['id'] ?>">نشط</label></div>
      </div>
      <div class="col-12 d-flex flex-wrap gap-2">
        <button class="btn btn-primary flex-grow-1 flex-sm-grow-0" form="<?= $f ?>">حفظ</button>
        <button class="btn btn-outline-danger flex-grow-1 flex-sm-grow-0" form="catdel-<?= $c['id'] ?>" onclick="return confirm('حذف هذا القسم؟')">حذف</button>
      </div>
    </div>
  </div>
<?php endforeach; ?>
</div>
