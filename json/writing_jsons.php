<?php 
$db = new PDO('mysql:host=localhost;dbname=drug_side_effects;charset=utf8', 'root', '');

$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

// $stmt = $db->query('SELECT umls_id,name FROM side_effects');
// $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

// $json = json_encode($rs);
// echo $json;
// file_put_contents('side_effects.json', $json);


// $stmt = $db->query('SELECT pert_id,pert_iname FROM drugs_lincs');
// $rs = $stmt->fetchAll(PDO::FETCH_ASSOC);

// $json = json_encode($rs);
// echo $json;
// file_put_contents('drugs.json', $json);

?>