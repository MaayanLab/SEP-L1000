<?php 
require_once 'login.php';
include 'functions.php';

$conn = new mysqli($db_hostname, $db_username, $db_password, $db_database);
if ($conn->connect_error) {
	trigger_error('Database connection failed: ' . $conn->connect_error, E_USER_ERROR);
}

$query = "SELECT pert_id,pert_iname,pubchem_cid FROM drugs_lincs";

$rs_arr = query_mysql($query, $conn);

$json = json_encode($rs_arr);
echo $json;
?>

