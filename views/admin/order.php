<h1 class="h3">طلب <span class="num"><?= e($order['order_number']??'') ?></span></h1>
<?php if(!$order): ?><div class="alert alert-danger" role="alert">غير موجود</div><?php else: ?>
<div class="row g-3">
  <div class="col-12 col-lg-8">
    <div class="card card-body">
      <p class="mb-1"><?= e($order['customer_name']) ?> — <a class="num" href="tel:<?= e($order['customer_phone']) ?>"><?= e($order['customer_phone']) ?></a></p>
      <p class="text-muted"><?= e($order['customer_address']) ?>، <?= e($order['customer_city']) ?></p>
      <div class="table-responsive">
        <table class="table align-middle"><caption class="visually-hidden">أصناف الطلب</caption><thead><tr><th scope="col">الصنف</th><th scope="col">الكمية</th><th scope="col">الإجمالي</th></tr></thead><tbody>
        <?php foreach($items as $i): ?><tr><td><?= e($i['product_name']) ?> <?= e($i['variant_name']) ?></td><td class="num"><?= (int)$i['quantity'] ?></td><td class="num"><?= money($i['line_total']) ?></td></tr><?php endforeach; ?>
        </tbody></table>
      </div>
      <div class="d-flex flex-wrap gap-2 align-items-center">
        <h2 class="h4 mb-0 num"><?= money($order['total']) ?></h2>
        <a class="btn btn-outline-dark ms-auto" href="<?= url('/admin/orders/'.$order['id'].'/invoice') ?>">طباعة فاتورة</a>
      </div>
    </div>
  </div>
  <div class="col-12 col-lg-4">
    <form method="post" action="<?= url('/admin/orders/update') ?>" class="card card-body"><?= csrf_field() ?>
      <input type="hidden" name="id" value="<?= $order['id'] ?>">
      <label class="form-label" for="o-status">حالة الطلب</label>
      <select id="o-status" name="status" class="form-select mb-3"><?php foreach(['placed','preparing','out_for_delivery','delivered','cancelled'] as $s): ?><option <?= $order['status']===$s?'selected':'' ?>><?= $s ?></option><?php endforeach; ?></select>
      <label class="form-label" for="o-notes">ملاحظات الإدارة</label>
      <textarea id="o-notes" name="admin_notes" rows="3" class="form-control mb-3"><?= e($order['admin_notes']) ?></textarea>
      <button class="btn btn-success">حفظ الحالة</button>
    </form>
  </div>
</div>
<?php endif; ?>
