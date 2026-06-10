<?php
class CartController extends BaseController
{
 public function show(): void { $c=new Cart(); $this->view('pages/cart',['items'=>$c->items(),'totals'=>$c->totals()]); }
 public function add(): void { verify_csrf(); try{(new Cart())->add((int)$_POST['product_id'],($_POST['variant_id']??'')!==''?(int)$_POST['variant_id']:null,($_POST['weight_grams']??'')!==''?(int)$_POST['weight_grams']:null,max(1,(int)($_POST['quantity']??1))); flash('success','تمت الإضافة إلى السلة');}catch(Throwable $e){flash('error',$e->getMessage());} redirect($_SERVER['HTTP_REFERER']??'/cart'); }
 public function update(): void { verify_csrf(); (new Cart())->updateQty((int)$_POST['id'],(int)$_POST['quantity']); redirect('/cart'); }
 public function remove(): void { verify_csrf(); (new Cart())->remove((int)$_POST['id']); redirect('/cart'); }
}
