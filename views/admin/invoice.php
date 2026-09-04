<h1 class="h4"><?= e(setting('store_name_ar')) ?></h1>
<h2 class="h6">فاتورة <span class="num"><?= e($order['order_number']) ?></span></h2>
<p><?= e($order['customer_name']) ?> — <span class="num"><?= e($order['customer_phone']) ?></span></p>
<div class="table-responsive">
<table class="table"><caption class="visually-hidden">تفاصيل الفاتورة</caption><thead><tr><th scope="col">الصنف</th><th scope="col">الكمية</th><th scope="col">السعر</th><th scope="col">الإجمالي</th></tr></thead><tbody>
<?php foreach($items as $i): ?><tr><td><?= e($i['product_name']) ?></td><td class="num"><?= (int)$i['quantity'] ?></td><td class="num"><?= money($i['unit_price']) ?></td><td class="num"><?= money($i['line_total']) ?></td></tr><?php endforeach; ?>
</tbody></table>
</div>
<h2 class="h5">الإجمالي: <span class="num"><?= money($order['total']) ?></span></h2>
