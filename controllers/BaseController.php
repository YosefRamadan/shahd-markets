<?php
abstract class BaseController { protected function view(string $v,array $d=[],string $l='layouts/site'): void { render($v,$d,$l); } }
