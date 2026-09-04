<h1>الإعدادات</h1>
<form method="post" class="card card-body" style="max-width:720px"><?= csrf_field() ?>
<?php foreach($settings as $s): $id='set-'.preg_replace('/[^a-zA-Z0-9_-]/','',$s['key']); ?>
  <label class="form-label" for="<?= e($id) ?>"><?= e($s['description'] ?: $s['key']) ?> <small class="text-muted d-block d-sm-inline num">(<?= e($s['key']) ?>)</small></label>
  <input id="<?= e($id) ?>" name="settings[<?= e($s['key']) ?>]" class="form-control mb-3" value="<?= e($s['value']) ?>">
<?php endforeach; ?>
<button class="btn btn-success">حفظ</button>
</form>
