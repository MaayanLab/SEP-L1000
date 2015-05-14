<?php # get drugs given se
require_once 'login.php';
include 'functions.php';

$umls_id = $_GET['umls_id'];

if (isset($_GET['probability'])) {
	$probability = floatval($_GET['probability']);
} else {
	$probability = 0.75;
}

if (isset($_GET['filter'])) { // whether to filter out known connections
	$filter = $_GET['filter'];
}

$conn = new mysqli($db_hostname, $db_username, $db_password, $db_database);
if ($conn->connect_error) {
  trigger_error('Database connection failed: ' . $conn->connect_error, E_USER_ERROR);
}

$query = "SELECT drug_id,p_val FROM prediction INNER JOIN side_effects ON prediction.se_id = side_effects.id WHERE umls_id='$umls_id' AND p_val>$probability";
$drugs = query_mysql($query, $conn); // drug_id and pvals

// get drug associated with this SE in SIDER
$query = "SELECT drug_id FROM sider_connections INNER JOIN side_effects ON sider_connections.se_id = side_effects.id WHERE umls_id='$umls_id'";
$known_drugs = query_mysql($query, $conn);

$known_drug_ids = array();
foreach ($known_drugs as $key => $line) {
	$id = $line['drug_id'];
	array_push($known_drug_ids, $id);
}

$arr_out = array();
for ($i=0; $i < count($drugs); $i++) { 
	$drug_id = $drugs[$i]['drug_id'];
	$write_this = True; // whether to write this drug out

	if (isset($filter)) {
		if (in_array($drug_id, $known_drug_ids)) {
			$write_this = False;
		}
	}
	if ($write_this) {
		$query = "SELECT pert_id,pert_iname FROM drugs_lincs WHERE id='$drug_id'";//to get names of pert_ids
		$drug_meta = query_mysql($query, $conn);
		$arr_out[$i]['name'] = $drug_meta[0]['pert_iname'];
		$arr_out[$i]['pert_id'] = $drug_meta[0]['pert_id'];
		$p_val = $drugs[$i]['p_val'];
		$arr_out[$i]['p_val'] = sprintf('%0.2f', $p_val);
		if (!isset($filter)) {
			if (in_array($drug_id, $known_drug_ids)) {
				$arr_out[$i]['sider'] = 'yes';
			} else {
				$arr_out[$i]['sider'] = 'no';
			}			
		}
	}
}

$conn->close();

$json = json_encode($arr_out);
header('Content-Type: application/json');
header('Content-Length: '.strlen($json));
echo $json;
?>