<?php
class CheckoutController extends BaseController
{
 public function form(): void { $c=new Cart(); $this->view('pages/checkout',['items'=>$c->items(),'totals'=>$c->totals()]); }
 public function submit(): void { verify_csrf(); try{$id=(new Order())->createFromCart($_POST); flash('success','تم استلام طلبك'); redirect('/orders/'.$id);}catch(Throwable $e){flash('error',$e->getMessage()); redirect('/checkout');} }
 public function order(int $id): void { $o=new Order(); $order=$o->find($id); if(!$order){http_response_code(404);render('pages/not-found');return;} $this->view('pages/order',['order'=>$order,'items'=>$o->items($id)]); }
}
