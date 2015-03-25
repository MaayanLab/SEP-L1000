<?php
// require_once 'se_profile.php';

$umls_id = $_GET['umls_id'];
$url = 'http://sideeffects.embl.de/se/' . $umls_id;
$html = file_get_contents($url);
echo $html;

?>
