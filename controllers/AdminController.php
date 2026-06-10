<?php
class AdminController extends BaseController
{
 private function adminView(string $v,array $d=[]): void { require_staff(); render('admin/'.$v,$d,'layouts/admin'); }
 public function dashboard(): void { $this->adminView('dashboard',['stats'=>(new Order())->stats(),'recent'=>array_slice((new Order())->all(),0,8)]); }
 public function categories(): void { $this->adminView('categories',['categories'=>(new Category())->all(false)]); }
 public function saveCategory(): void { require_staff(); verify_csrf(); try{$m=new Category(); $id=($_POST['id']??'')?(int)$_POST['id']:null; $old=$id?$m->find($id):null; $img=upload_image('image','categories',$old['image_url']??null); $m->save(['name_ar'=>$_POST['name_ar'],'slug'=>$_POST['slug']?:slugify_ar($_POST['name_ar']),'image_url'=>$img,'sort_order'=>(int)$_POST['sort_order'],'is_active'=>isset($_POST['is_active'])?1:0],$id); flash('success','تم حفظ القسم');}catch(Throwable $e){flash('error',$e->getMessage());} redirect('/admin/categories'); }
 public function deleteCategory(): void { require_staff(); verify_csrf(); (new Category())->delete((int)$_POST['id']); redirect('/admin/categories'); }
 public function products(): void { $p=new Product(); $this->adminView('products',['products'=>$p->all(false),'categories'=>(new Category())->all(false),'productModel'=>$p]); }
 public function saveProduct(): void { require_staff(); verify_csrf(); try{$m=new Product(); $id=($_POST['id']??'')?(int)$_POST['id']:null; $old=$id?$m->find($id):null; $img=upload_image('image','products',$old['image_url']??null); $pid=$m->save(['category_id'=>(int)$_POST['category_id'],'name_ar'=>$_POST['name_ar'],'slug'=>$_POST['slug']?:slugify_ar($_POST['name_ar']),'description_ar'=>$_POST['description_ar'],'image_url'=>$img,'base_price'=>(float)$_POST['base_price'],'stock'=>(int)$_POST['stock'],'is_weight_based'=>isset($_POST['is_weight_based'])?1:0,'weight_options_grams'=>$_POST['weight_options_grams']??'','price_per_kg'=>($_POST['price_per_kg']??'')!==''?(float)$_POST['price_per_kg']:null,'unit_label_ar'=>$_POST['unit_label_ar']??null,'is_active'=>isset($_POST['is_active'])?1:0,'sort_order'=>(int)$_POST['sort_order']],$id); $m->saveVariants($pid,$_POST['variant_name']??[],$_POST['variant_price']??[],$_POST['variant_stock']??[]); flash('success','تم حفظ المنتج');}catch(Throwable $e){flash('error',$e->getMessage());} redirect('/admin/products'); }
 public function deleteProduct(): void { require_staff(); verify_csrf(); (new Product())->delete((int)$_POST['id']); redirect('/admin/products'); }
 public function orders(): void { $this->adminView('orders',['orders'=>(new Order())->all()]); }
 public function order(int $id): void { $o=new Order(); $this->adminView('order',['order'=>$o->find($id),'items'=>$o->items($id)]); }
 public function updateOrder(): void { require_staff(); verify_csrf(); (new Order())->updateStatus((int)$_POST['id'],$_POST['status'],$_POST['admin_notes']??null); redirect('/admin/orders/'.(int)$_POST['id']); }
 public function invoice(int $id): void { require_staff(); $o=new Order(); render('admin/invoice',['order'=>$o->find($id),'items'=>$o->items($id)],'layouts/print'); }
 public function inventory(): void { $this->adminView('inventory',['low'=>(new Product())->lowStock(),'products'=>(new Product())->all(false)]); }
 public function users(): void { $this->adminView('users',['users'=>(new User())->all()]); }
 public function saveUser(): void { require_staff(); verify_csrf(); (new User())->updateRoleStatus((int)$_POST['id'],$_POST['role'],isset($_POST['is_active'])?1:0); redirect('/admin/users'); }
 public function settings(): void { $this->adminView('settings',['settings'=>(new Setting())->all()]); }
 public function saveSettings(): void { require_staff(); verify_csrf(); (new Setting())->updateMany($_POST['settings']??[]); flash('success','تم حفظ الإعدادات'); redirect('/admin/settings'); }
}
