<?php 
require_once 'login.php';
include 'functions.php';

$umls_id = $_GET['umls_id'];

if (isset($_GET['probability'])) {
	$probability = floatval($_GET['probability']);
} else {
	$probability = 0.75;
}

$conn = new mysqli($db_hostname, $db_username, $db_password, $db_database);
if ($conn->connect_error) {
  trigger_error('Database connection failed: ' . $conn->connect_error, E_USER_ERROR);
}

$query = "SELECT pert_id,p_val FROM p_vals WHERE umls_id='$umls_id' AND p_val>$probability";
$drugs = query_mysql($query, $conn);

// get drug associated with this SE in SIDER
$query = "SELECT pert_id FROM sider_connections WHERE umls_id='$umls_id'";
$known_drugs = query_mysql($query, $conn);


$known_drug_ids = array();
foreach ($known_drugs as $key => $line) {
	$id = $line['pert_id'];
	array_push($known_drug_ids, $id);
}

for ($i=0; $i < count($drugs); $i++) { 
	$pert_id = $drugs[$i]['pert_id'];
	$query = "SELECT pert_iname FROM drugs_lincs WHERE pert_id='$pert_id'";//to get names of pert_ids
	$name = query_mysql($query, $conn);
	$drugs[$i]['name'] = $name[0]['pert_iname'];
	$p_val = $drugs[$i]['p_val'];
	$drugs[$i]['p_val'] = sprintf('%0.2f', $p_val);
	if (in_array($pert_id, $known_drug_ids)) {
		$drugs[$i]['sider'] = 'yes';
	} else {
		$drugs[$i]['sider'] = 'no';
	}
}

$conn->close();

$json = json_encode($drugs);
header('Content-Type: application/json');
header('Content-Length: '.strlen($json));
echo $json;
?>