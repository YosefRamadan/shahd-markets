<?php
class User extends Model
{
    public function findByEmail(string $email): ?array { $st=$this->db->prepare('SELECT * FROM users WHERE email=? LIMIT 1'); $st->execute([$email]); return $st->fetch() ?: null; }
    public function find(int $id): ?array { $st=$this->db->prepare('SELECT * FROM users WHERE id=?'); $st->execute([$id]); return $st->fetch() ?: null; }
    public function create(array $d): int { $st=$this->db->prepare('INSERT INTO users(full_name,email,phone,password_hash,default_address,city,role) VALUES(?,?,?,?,?,?,?)'); $st->execute([$d['full_name'],$d['email'],$d['phone'] ?: null,password_hash($d['password'], PASSWORD_DEFAULT),$d['default_address'] ?? null,$d['city'] ?? 'الفيوم',$d['role'] ?? 'customer']); return (int)$this->db->lastInsertId(); }
    public function update(int $id, array $d): void { $st=$this->db->prepare('UPDATE users SET full_name=?, phone=?, default_address=?, city=? WHERE id=?'); $st->execute([$d['full_name'],$d['phone'] ?: null,$d['default_address'] ?? null,$d['city'] ?? 'الفيوم',$id]); }
    public function setRemember(int $id, ?string $hash): void { $st=$this->db->prepare('UPDATE users SET remember_token_hash=? WHERE id=?'); $st->execute([$hash,$id]); }
    public function findByRemember(string $token): ?array { $rows=$this->db->query('SELECT * FROM users WHERE remember_token_hash IS NOT NULL AND is_active=1')->fetchAll(); foreach($rows as $r) if (password_verify($token, $r['remember_token_hash'])) return $r; return null; }
    public function createReset(int $id, string $token): void { $this->db->prepare('INSERT INTO password_resets(user_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(NOW(), INTERVAL 1 HOUR))')->execute([$id,password_hash($token,PASSWORD_DEFAULT)]); }
    public function resetByToken(string $token, string $password): bool { $rows=$this->db->query('SELECT * FROM password_resets WHERE used_at IS NULL AND expires_at > NOW() ORDER BY id DESC')->fetchAll(); foreach($rows as $r){ if(password_verify($token,$r['token_hash'])){ $this->db->prepare('UPDATE users SET password_hash=? WHERE id=?')->execute([password_hash($password,PASSWORD_DEFAULT),$r['user_id']]); $this->db->prepare('UPDATE password_resets SET used_at=NOW() WHERE id=?')->execute([$r['id']]); return true; }} return false; }
    public function all(): array { return $this->db->query('SELECT id,full_name,email,phone,city,role,is_active,created_at FROM users ORDER BY created_at DESC')->fetchAll(); }
    public function updateRoleStatus(int $id, string $role, int $active): void { $this->db->prepare('UPDATE users SET role=?, is_active=? WHERE id=?')->execute([$role,$active,$id]); if(in_array($role,['admin','manager'],true)) $this->db->prepare('INSERT IGNORE INTO admins(user_id) VALUES(?)')->execute([$id]); }
}
