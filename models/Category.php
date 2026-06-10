<?php
class Category extends Model
{
    public function all(bool $activeOnly=false): array { $sql='SELECT * FROM categories'.($activeOnly?' WHERE is_active=1':'').' ORDER BY sort_order,name_ar'; return $this->db->query($sql)->fetchAll(); }
    public function findBySlug(string $slug): ?array { $st=$this->db->prepare('SELECT * FROM categories WHERE slug=?'); $st->execute([$slug]); return $st->fetch() ?: null; }
    public function find(int $id): ?array { $st=$this->db->prepare('SELECT * FROM categories WHERE id=?'); $st->execute([$id]); return $st->fetch() ?: null; }
    public function save(array $d, ?int $id=null): void { if($id){$st=$this->db->prepare('UPDATE categories SET name_ar=?,slug=?,image_url=?,sort_order=?,is_active=? WHERE id=?'); $st->execute([$d['name_ar'],$d['slug'],$d['image_url'],$d['sort_order'],$d['is_active'],$id]);} else {$st=$this->db->prepare('INSERT INTO categories(name_ar,slug,image_url,sort_order,is_active) VALUES(?,?,?,?,?)'); $st->execute([$d['name_ar'],$d['slug'],$d['image_url'],$d['sort_order'],$d['is_active']]);} }
    public function delete(int $id): void { $this->db->prepare('DELETE FROM categories WHERE id=?')->execute([$id]); }
}
