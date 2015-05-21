<?php // API for legends
require_once 'login.php';
include 'functions.php';

$conn = new mysqli($db_hostname, $db_username, $db_password, $db_database);
if ($conn->connect_error) {
  trigger_error('Database connection failed: ' . $conn->connect_error, E_USER_ERROR);
}

if (isset($_GET['type'])) {
	$type = $_GET['type'];
	if ($type == 'side_effect_network') {
		$query = "SELECT name,color FROM soc";
	} else {
		$query = "SELECT pert_icollection FROM drugs_lincs GROUP BY pert_icollection";
	}
}

$result = query_mysql($query, $conn);
$conn->close();

$json = json_encode($result);
echo $json;
?>
