<?php 
require_once 'login.php';
include 'functions.php';

$pert_id = $_GET['pert_id'];

$conn = new mysqli($db_hostname, $db_username, $db_password, $db_database);

if ($conn->connect_error) {
  trigger_error('Database connection failed: ' . $conn->connect_error, E_USER_ERROR);
}

$query = "SELECT * FROM drugs_lincs WHERE pert_id='$pert_id'";
$rs_lincs = query_mysql($query, $conn);
$drug_meta['drugs_lincs'] = $rs_lincs[0]; // to store info for the drug

$pcid = $rs_lincs[0]['pubchem_cid'];

// don't want to show info from drugbank and stitch
// if (!is_null($pcid)) { 
//   $tables = array("drugs_drugbank", "drugs_stitch");
//   foreach ($tables as $table) {
//     $query = "SELECT * FROM $table WHERE pubchem_cid='$pcid'";
//     $rs_arr = query_mysql($query, $conn);
//     if(count($rs_arr) == 1) {
//     	$drug_meta[$table] = $rs_arr[0];
//     }
//   }
// }

$conn->close();

$json = json_encode($drug_meta);
echo $json;
?>