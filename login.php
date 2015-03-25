<?php //login.php 
$db_hostname = 'localhost';
$cwd = getcwd();
if ($cwd === "C:\\xampp\htdocs\SEP-L1000") { // localhost
	$db_database = 'drug_side_effects';
	$db_username = 'root';
	$db_password = '';
} else { // server
	$db_database = 'maaya0_SEP';
	$db_username = 'maaya0_Zichen';
	$db_password = 'systemsbiology';
}
?>