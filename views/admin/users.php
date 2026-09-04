<h1>المستخدمون</h1>
<?php foreach($users as $u): ?><form id="usr-<?= $u['id'] ?>" method="post" action="<?= url('/admin/users/save') ?>" class="d-none"><?= csrf_field() ?><input type="hidden" name="id" value="<?= $u['id'] ?>"></form><?php endforeach; ?>
<div class="table-responsive d-none d-lg-block">
<table class="table bg-white align-middle"><caption class="visually-hidden">إدارة المستخدمين</caption><thead><tr><th scope="col">الاسم</th><th scope="col">البريد</th><th scope="col">الهاتف</th><th scope="col">الدور</th><th scope="col">نشط</th><th scope="col"><span class="visually-hidden">إجراءات</span></th></tr></thead><tbody>
<?php foreach($users as $u): $f='usr-'.$u['id']; ?><tr>
  <td><?= e($u['full_name']) ?></td><td class="num"><?= e($u['email']) ?></td><td class="num"><?= e($u['phone']) ?></td>
  <td><label class="visually-hidden" for="ur-<?= $u['id'] ?>">دور <?= e($u['full_name']) ?></label><select id="ur-<?= $u['id'] ?>" form="<?= $f ?>" name="role" class="form-select form-select-sm"><?php foreach(['customer','manager','admin'] as $r): ?><option <?= $u['role']===$r?'selected':'' ?>><?= $r ?></option><?php endforeach; ?></select></td>
  <td><input class="form-check-input" form="<?= $f ?>" type="checkbox" id="ua-<?= $u['id'] ?>" name="is_active" <?= $u['is_active']?'checked':'' ?>><label class="visually-hidden" for="ua-<?= $u['id'] ?>">تفعيل <?= e($u['full_name']) ?></label></td>
  <td><button class="btn btn-sm btn-primary" form="<?= $f ?>">حفظ</button></td>
</tr><?php endforeach; ?>
</tbody></table>
</div>
<div class="d-grid gap-3 d-lg-none">
<?php foreach($users as $u): $f='usr-'.$u['id']; ?>
  <div class="card card-body">
    <b class="text-truncate"><?= e($u['full_name']) ?></b>
    <div class="small text-muted num text-truncate"><?= e($u['email']) ?></div>
    <div class="small text-muted num"><?= e($u['phone']) ?></div>
    <label class="form-label mt-2" for="mur-<?= $u['id'] ?>">الدور</label>
    <select id="mur-<?= $u['id'] ?>" form="<?= $f ?>" name="role" class="form-select"><?php foreach(['customer','manager','admin'] as $r): ?><option <?= $u['role']===$r?'selected':'' ?>><?= $r ?></option><?php endforeach; ?></select>
    <div class="form-check my-3"><input class="form-check-input" form="<?= $f ?>" type="checkbox" id="mua-<?= $u['id'] ?>" name="is_active" <?= $u['is_active']?'checked':'' ?>><label class="form-check-label" for="mua-<?= $u['id'] ?>">نشط</label></div>
    <button class="btn btn-primary" form="<?= $f ?>">حفظ</button>
  </div>
<?php endforeach; ?>
</div>
