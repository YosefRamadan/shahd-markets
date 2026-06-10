<?php
class Setting extends Model
{
    public static function get(string $key, $default = '') { $m = new self(); $st = $m->db->prepare('SELECT value FROM settings WHERE `key`=?'); $st->execute([$key]); $v = $st->fetchColumn(); return $v === false ? $default : $v; }
    public function publicAll(): array { return $this->db->query('SELECT * FROM settings WHERE is_public=1 ORDER BY `key`')->fetchAll(); }
    public function all(): array { return $this->db->query('SELECT * FROM settings ORDER BY `key`')->fetchAll(); }
    public function updateMany(array $data): void { $st=$this->db->prepare('UPDATE settings SET value=? WHERE `key`=?'); foreach($data as $k=>$v) $st->execute([$v,$k]); }
}
