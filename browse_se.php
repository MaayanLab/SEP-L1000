<?php 
require_once 'login.php';
include 'functions.php';

$conn = new mysqli($db_hostname, $db_username, $db_password, $db_database);
if ($conn->connect_error) {
  trigger_error('Database connection failed: ' . $conn->connect_error, E_USER_ERROR);
}

$query = "SELECT * FROM side_effects";
$rs_arr = query_mysql($query, $conn);

$conn->close();

$num_rows = count($rs_arr);
$out_arr = array();
foreach ($rs_arr as $row) {
	$synonyms = explode("|", $row["synonyms"]);
	$row["synonyms"] = $synonyms;
	array_push($out_arr, $row);
}
$json = json_encode($out_arr);
echo $json;
?>