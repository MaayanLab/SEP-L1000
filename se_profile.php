<?php 
require_once 'login.php';
include 'functions.php';

$umls_id = $_GET['umls_id'];

$conn = new mysqli($db_hostname, $db_username, $db_password, $db_database);
if ($conn->connect_error) {
  trigger_error('Database connection failed: ' . $conn->connect_error, E_USER_ERROR);
}

// $query = "SELECT * FROM umls_ids INNER JOIN side_effects ON side_effects.umls_id=umls_ids.umls_id WHERE umls_ids.umls_id='$umls_id'";
$query = "SELECT * FROM side_effects WHERE umls_id='$umls_id'";
$rs_se = query_mysql($query, $conn);
$rs_se[0]['synonyms'] = explode("|", $rs_se[0]["synonyms"]);

$conn->close();

$json = json_encode($rs_se[0]);
echo $json;

?>
