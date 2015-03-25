<?php
require_once 'login.php';
include 'functions.php';

$conn = new mysqli($db_hostname, $db_username, $db_password, $db_database);
if ($conn->connect_error) {
  trigger_error('Database connection failed: ' . $conn->connect_error, E_USER_ERROR);
}

if (isset($_GET['term'])) {
	$searchq = $_GET["term"];
	$searchq = preg_replace("#[^0-9a-z]#i", "", $searchq);
	$searchq = "%" . $searchq . "%";

	$query1 = "SELECT pert_id, pert_iname, alt_name FROM drugs_lincs WHERE pert_id LIKE '$searchq' OR pert_iname LIKE '$searchq' OR alt_name LIKE '$searchq'";
	$query2 = "SELECT umls_id, name, synonyms FROM side_effects WHERE umls_id LIKE '$searchq' OR name LIKE '$searchq' OR synonyms LIKE '$searchq'";
	$rs_arr1 = query_mysql($query1, $conn);
	$rs_arr2 = query_mysql($query2, $conn);
	
	$count = count($rs_arr1) + count($rs_arr2);
	if ($count == 0) {
		$output = 'NULL';
	} else {
		$rs_arr = array("drugs" => $rs_arr1, "se" => $rs_arr2);
		$output = $rs_arr;
	}
	$json = json_encode($output);
	echo $json;
}

?>