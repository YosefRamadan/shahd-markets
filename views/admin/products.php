<h1>المنتجات</h1>
<details class="card card-body mb-4" open>
  <summary class="fw-bold mb-3">إضافة / تعديل منتج</summary>
  <form method="post" enctype="multipart/form-data" action="<?= url('/admin/products/save') ?>"><?= csrf_field() ?>
    <div class="row g-3">
      <div class="col-12 col-md-4"><label class="form-label" for="p-cat">القسم</label><select id="p-cat" name="category_id" class="form-select"><?php foreach($categories as $c): ?><option value="<?= $c['id'] ?>"><?= e($c['name_ar']) ?></option><?php endforeach; ?></select></div>
      <div class="col-12 col-md-4"><label class="form-label" for="p-name">اسم المنتج</label><input id="p-name" name="name_ar" required class="form-control"></div>
      <div class="col-12 col-md-4"><label class="form-label" for="p-slug">الرابط (slug)</label><input id="p-slug" name="slug" class="form-control"></div>
      <div class="col-6 col-md-3"><label class="form-label" for="p-price">السعر</label><input id="p-price" name="base_price" type="number" step=".01" inputmode="decimal" class="form-control"></div>
      <div class="col-6 col-md-3"><label class="form-label" for="p-stock">المخزون</label><input id="p-stock" name="stock" type="number" inputmode="numeric" class="form-control"></div>
      <div class="col-6 col-md-3"><label class="form-label" for="p-kg">سعر الكجم</label><input id="p-kg" name="price_per_kg" type="number" step=".01" inputmode="decimal" class="form-control"></div>
      <div class="col-6 col-md-3"><label class="form-label" for="p-sort">الترتيب</label><input id="p-sort" name="sort_order" type="number" class="form-control" value="0"></div>
      <div class="col-12"><label class="form-label" for="p-desc">الوصف</label><textarea id="p-desc" name="description_ar" rows="3" class="form-control"></textarea></div>
      <div class="col-12 col-md-4"><label class="form-label" for="p-weights">خيارات الوزن (جم)</label><input id="p-weights" name="weight_options_grams" class="form-control num" value="250,500,750,1000"></div>
      <div class="col-6 col-md-4"><label class="form-label" for="p-unit">الوحدة</label><input id="p-unit" name="unit_label_ar" class="form-control"></div>
      <div class="col-6 col-md-4"><label class="form-label" for="p-img">الصورة</label><input id="p-img" type="file" name="image" accept="image/*" class="form-control"></div>
      <div class="col-12 d-flex flex-wrap gap-3">
        <div class="form-check"><input class="form-check-input" type="checkbox" id="p-weight" name="is_weight_based"><label class="form-check-label" for="p-weight">يباع بالوزن</label></div>
        <div class="form-check"><input class="form-check-input" type="checkbox" id="p-active" name="is_active" checked><label class="form-check-label" for="p-active">نشط</label></div>
      </div>
      <div class="col-12"><h2 class="h6 mb-2">البدائل (اختياري)</h2>
        <div id="variants">
          <div class="row g-2 variant-row mb-2">
            <div class="col-12 col-sm-4"><input name="variant_name[]" class="form-control" placeholder="اسم البديل" aria-label="اسم البديل"></div>
            <div class="col-6 col-sm-3"><input name="variant_price[]" type="number" step=".01" inputmode="decimal" class="form-control" placeholder="السعر" aria-label="سعر البديل"></div>
            <div class="col-6 col-sm-3"><input name="variant_stock[]" type="number" inputmode="numeric" class="form-control" placeholder="المخزون" aria-label="مخزون البديل"></div>
            <div class="col-12 col-sm-2 d-grid"><button type="button" data-add-variant class="btn btn-outline-secondary" aria-label="إضافة بديل جديد">+ بديل</button></div>
          </div>
        </div>
      </div>
      <div class="col-12 d-grid d-sm-block"><button class="btn btn-success">حفظ المنتج</button></div>
    </div>
  </form>
</details>

<div class="table-responsive d-none d-lg-block">
<table class="table bg-white align-middle"><caption class="visually-hidden">قائمة المنتجات</caption><thead><tr><th scope="col">المنتج</th><th scope="col">القسم</th><th scope="col">السعر</th><th scope="col">المخزون</th><th scope="col"><span class="visually-hidden">إجراءات</span></th></tr></thead><tbody>
<?php foreach($products as $p): ?><tr><td><?= e($p['name_ar']) ?></td><td><?= e($p['category_name']) ?></td><td class="num"><?= e($productModel->displayPrice($p,$productModel->variants($p['id'],true))) ?></td><td class="num"><?= (int)$p['stock'] ?></td><td><form method="post" action="<?= url('/admin/products/delete') ?>"><?= csrf_field() ?><input type="hidden" name="id" value="<?= $p['id'] ?>"><button class="btn btn-sm btn-outline-danger" onclick="return confirm('حذف هذا المنتج؟')">حذف</button></form></td></tr><?php endforeach; ?>
</tbody></table>
</div>

<div class="d-grid gap-3 d-lg-none">
<?php foreach($products as $p): ?>
  <div class="card card-body">
    <b class="text-truncate"><?= e($p['name_ar']) ?></b>
    <span class="text-muted small"><?= e($p['category_name']) ?></span>
    <div class="d-flex flex-wrap gap-2 align-items-center mt-2">
      <span class="num fw-bold"><?= e($productModel->displayPrice($p,$productModel->variants($p['id'],true))) ?></span>
      <span class="badge text-bg-light num">مخزون: <?= (int)$p['stock'] ?></span>
      <form method="post" action="<?= url('/admin/products/delete') ?>" class="ms-auto"><?= csrf_field() ?><input type="hidden" name="id" value="<?= $p['id'] ?>"><button class="btn btn-sm btn-outline-danger" onclick="return confirm('حذف هذا المنتج؟')">حذف</button></form>
    </div>
  </div>
<?php endforeach; ?>
</div>
