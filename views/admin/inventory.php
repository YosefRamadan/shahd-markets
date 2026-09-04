<h1>المخزون</h1>
<h2 class="h5 mt-4">منتجات منخفضة المخزون</h2>
<div class="table-responsive">
<table class="table bg-white align-middle"><caption class="visually-hidden">منتجات منخفضة المخزون</caption><thead><tr><th scope="col">المنتج</th><th scope="col">البديل</th><th scope="col">المخزون</th></tr></thead><tbody>
<?php foreach($low as $r): ?><tr><td><?= e($r['name_ar']) ?></td><td><?= e($r['variant_name']) ?></td><td><span class="badge text-bg-danger num">منخفض: <?= (int)$r['stock'] ?></span></td></tr><?php endforeach; ?>
<?php if(!$low): ?><tr><td colspan="3" class="text-muted">لا توجد منتجات منخفضة المخزون</td></tr><?php endif; ?>
</tbody></table>
</div>
<h2 class="h5 mt-4">كل المنتجات</h2>
<div class="table-responsive">
<table class="table bg-white align-middle"><caption class="visually-hidden">كل المنتجات والمخزون</caption><thead><tr><th scope="col">المنتج</th><th scope="col">المخزون</th><th scope="col">نشط</th></tr></thead><tbody>
<?php foreach($products as $p): ?><tr><td><?= e($p['name_ar']) ?></td><td class="num"><?= (int)$p['stock'] ?></td><td><span class="badge <?= $p['is_active']?'text-bg-success':'text-bg-secondary' ?>"><?= $p['is_active']?'نعم':'لا' ?></span></td></tr><?php endforeach; ?>
</tbody></table>
</div>
