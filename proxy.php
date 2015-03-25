<?php
require_once 'login.php';

$umls_id = $_GET['name'];
// echo $umls_id;

$conn = new mysqli($db_hostname, $db_username, $db_password, $db_database);
if ($conn->connect_error) {
  trigger_error('Database connection failed: ' . $conn->connect_error, E_USER_ERROR);
}

$query = "SELECT * FROM side_effects WHERE umls_id = ?";

$stmt = $conn->prepare($query);
if($stmt === false) {
  trigger_error('Wrong SQL query: ' . $query . ' Error: ' . $conn->error, E_USER_ERROR);
}

$stmt->bind_param('s', $umls_id);
$stmt->execute();

$rs = $stmt->get_result();
$rs_arr = $rs->fetch_all(MYSQLI_ASSOC);
$rs->free();
$stmt->close();
$conn->close();

// echo "side effect: " . $rs_arr[0]['name'] . "</br>";
// echo "synonyms: " . $rs_arr[0]['synonyms'] . "</br>";

$url = 'http://sideeffects.embl.de/se/' . $umls_id;
$html = file_get_contents($url);
echo $html;

?>
