<?php //retrive se information from database
require_once 'login.php';

$umls_id = $_GET['umls_id'];

$conn = new mysqli($db_hostname, $db_username, $db_password, $db_database);
if ($conn->connect_error) {
  trigger_error('Database connection failed: ' . $conn->connect_error, E_USER_ERROR);
}

$query = "SELECT * FROM side_effects WHERE umls_id = '$umls_id'";
$rs_arr = query_mysql($query, $conn);
$conn->close();

echo "side effect: " . $rs_arr[0]['name'] . "</br>";
echo "synonyms: " . $rs_arr[0]['synonyms'] . "</br>";

$url = 'http://sideeffects.embl.de/se/' . $umls_id;

?>
