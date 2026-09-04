<h1>الطلبات</h1>
<div class="table-responsive">
<table class="table bg-white align-middle"><caption class="visually-hidden">قائمة الطلبات</caption><thead><tr><th scope="col">الرقم</th><th scope="col">العميل</th><th scope="col">الهاتف</th><th scope="col">الحالة</th><th scope="col">الإجمالي</th><th scope="col">التاريخ</th></tr></thead><tbody>
<?php foreach($orders as $o): ?><tr><td><a href="<?= url('/admin/orders/'.$o['id']) ?>"><?= e($o['order_number']) ?></a></td><td><?= e($o['customer_name']) ?></td><td class="num"><a href="tel:<?= e($o['customer_phone']) ?>"><?= e($o['customer_phone']) ?></a></td><td><span class="badge text-bg-secondary"><?= e($o['status']) ?></span></td><td class="num"><?= money($o['total']) ?></td><td class="num small"><?= e($o['created_at']) ?></td></tr><?php endforeach; ?>
</tbody></table>
</div>
