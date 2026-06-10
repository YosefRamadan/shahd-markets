<?php
// Run once locally or from InfinityFree file manager URL protection context, then delete this file.
require __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../config/database.php';
if (PHP_SAPI !== 'cli') { http_response_code(403); exit('Run from CLI or create the admin manually with the SQL shown in docs/deployment-guide.md'); }
$name = $argv[1] ?? 'مدير المتجر';
$email = $argv[2] ?? 'admin@example.com';
$password = $argv[3] ?? bin2hex(random_bytes(6));
$phone = $argv[4] ?? null;
$u = new User();
if ($u->findByEmail($email)) { echo "Admin already exists: $email\n"; exit(0); }
$id = $u->create(['full_name'=>$name,'email'=>$email,'phone'=>$phone,'password'=>$password,'role'=>'admin','city'=>'الفيوم']);
$u->updateRoleStatus($id, 'admin', 1);
echo "Admin created\nEmail: $email\nPassword: $password\n";
