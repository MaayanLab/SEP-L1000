<?php
require_once 'login.php';
include 'functions.php';

$conn = new mysqli($db_hostname, $db_username, $db_password, $db_database);
if ($conn->connect_error) {
  trigger_error('Database connection failed: ' . $conn->connect_error, E_USER_ERROR);
}

function getCount($query, $conn)
{
	$result = query_mysql($query, $conn);
	return $result[0]['COUNT(*)'];
}

$out_arr = array();

$out_arr['drugs'] = getCount("SELECT COUNT(*) FROM drugs_lincs", $conn);
$out_arr['side_effects'] = getCount("SELECT COUNT(*) FROM side_effects WHERE auroc IS NOT NULL", $conn);
// $out_arr['side_effects_predictable'] = getCount("SELECT COUNT(*) FROM side_effects WHERE auroc IS NOT NULL AND auroc > 0.7", $conn);

echo json_encode($out_arr);

$conn->close();
?>