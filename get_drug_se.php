<?php // to get predicted SEs for a drug
require_once 'login.php';
include 'functions.php';

$pert_id = $_GET['pert_id'];
$conn = new mysqli($db_hostname, $db_username, $db_password, $db_database);
if ($conn->connect_error) {
  trigger_error('Database connection failed: ' . $conn->connect_error, E_USER_ERROR);
}
// get SE assocated for the drug
$query = "SELECT umls_id,p_val FROM p_vals WHERE pert_id='$pert_id'";
$side_effects = query_mysql($query, $conn); # all the predicted side effects of the drug

// get SE associated with this drug in SIDER
$query = "SELECT umls_id FROM sider_connections WHERE pert_id='$pert_id'";
$known_side_effects = query_mysql($query, $conn);

$known_side_effect_ids = array();
foreach ($known_side_effects as $key => $line) {
	$id = $line['umls_id'];
	array_push($known_side_effect_ids, $id);
}

for ($i=0; $i < count($side_effects); $i++) { 
	$umls_id = $side_effects[$i]['umls_id'];
	$query = "SELECT name FROM side_effects WHERE umls_id='$umls_id'";//to get names of side effects
	$name = query_mysql($query, $conn);
	$side_effects[$i]['name'] = $name[0]['name'];
	$p_val = $side_effects[$i]['p_val'];
	$side_effects[$i]['p_val'] = sprintf('%0.2f', $p_val);
	if (in_array($umls_id, $known_side_effect_ids)) {
		$side_effects[$i]['sider'] = 'yes';
	} else {
		$side_effects[$i]['sider'] = 'no';
	}
}

$conn->close();

$json = json_encode($side_effects);
echo $json;
?>