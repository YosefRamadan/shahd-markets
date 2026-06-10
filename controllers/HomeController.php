<?php
class HomeController extends BaseController
{
 public function index(): void { $p=new Product(); $this->view('pages/home',['categories'=>(new Category())->all(true),'products'=>$p->all(true,null,12),'productModel'=>$p]); }
 public function categories(): void { $this->view('pages/categories',['categories'=>(new Category())->all(true)]); }
 public function category(string $slug): void { $c=(new Category())->findBySlug($slug); if(!$c){http_response_code(404);$this->view('pages/not-found');return;} $p=new Product(); $this->view('pages/category',['category'=>$c,'products'=>$p->all(true,(int)$c['id']),'productModel'=>$p]); }
 public function product(string $slug): void { $p=new Product(); $product=$p->findBySlug($slug); if(!$product){http_response_code(404);$this->view('pages/not-found');return;} $this->view('pages/product',['product'=>$product,'variants'=>$p->variants((int)$product['id'],true),'productModel'=>$p]); }
}
