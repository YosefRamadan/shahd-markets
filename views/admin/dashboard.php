<h1>لوحة التحكم</h1>
<div class="row g-3 my-3 row-cols-2 row-cols-lg-5">
<?php foreach(['revenue'=>'الإيرادات','orders'=>'الطلبات','pending'=>'قيد التنفيذ','customers'=>'العملاء','low_stock'=>'مخزون منخفض'] as $k=>$label): ?>
  <div class="col"><div class="card card-body h-100"><span class="text-muted small"><?= $label ?></span><b class="fs-5 text-truncate num"><?= $k==='revenue'?money($stats[$k]):e($stats[$k]) ?></b></div></div>
<?php endforeach; ?>
</div>
<h2 class="h5">أحدث الطلبات</h2>
<div class="table-responsive">
<table class="table bg-white align-middle"><caption class="visually-hidden">أحدث الطلبات</caption><thead><tr><th scope="col">الرقم</th><th scope="col">العميل</th><th scope="col">الحالة</th><th scope="col">الإجمالي</th></tr></thead><tbody>
<?php foreach($recent as $o): ?><tr><td><a href="<?= url('/admin/orders/'.$o['id']) ?>"><?= e($o['order_number']) ?></a></td><td><?= e($o['customer_name']) ?></td><td><span class="badge text-bg-secondary"><?= e($o['status']) ?></span></td><td class="num"><?= money($o['total']) ?></td></tr><?php endforeach; ?>
</tbody></table>
</div>
