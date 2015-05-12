<?php // to get predicted SEs for a drug
require_once 'login.php';
include 'functions.php';

$pert_id = $_GET['pert_id'];
$conn = new mysqli($db_hostname, $db_username, $db_password, $db_database);
if ($conn->connect_error) {
  trigger_error('Database connection failed: ' . $conn->connect_error, E_USER_ERROR);
}
// get SE assocated for the drug

$query = "SELECT se_id,p_val FROM prediction INNER JOIN drugs_lincs ON prediction.drug_id = drugs_lincs.id WHERE pert_id='$pert_id'";
$side_effects = query_mysql($query, $conn); # all the predicted se_ids of the drug

// get SE associated with this drug in SIDER
$query = "SELECT se_id FROM sider_connections INNER JOIN drugs_lincs ON sider_connections.drug_id = drugs_lincs.id WHERE pert_id='$pert_id'";
$known_side_effects = query_mysql($query, $conn);

$known_side_effect_ids = array(); // se_id of known connections
foreach ($known_side_effects as $key => $line) {
	$id = $line['se_id'];
	array_push($known_side_effect_ids, $id);
}

$arr_out = array();

for ($i=0; $i < count($side_effects); $i++) { 
	$se_id = $side_effects[$i]['se_id'];
	$query = "SELECT umls_id,name FROM side_effects WHERE id='$se_id'";//to get names of side effects
	$se_meta = query_mysql($query, $conn);
	$arr_out[$i]['name'] = $se_meta[0]['name'];
	$arr_out[$i]['umls_id'] = $se_meta[0]['umls_id'];
	$p_val = $side_effects[$i]['p_val'];
	$arr_out[$i]['p_val'] = sprintf('%0.2f', $p_val);
	if (in_array($se_id, $known_side_effect_ids)) {
		$arr_out[$i]['sider'] = 'yes';
	} else {
		$arr_out[$i]['sider'] = 'no';
	}
}

$conn->close();

$json = json_encode($arr_out);
echo $json;
?>