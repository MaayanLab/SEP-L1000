<?php  // compute summary statistics
require_once 'login.php';
include 'functions.php';

$conn = new mysqli($db_hostname, $db_username, $db_password, $db_database);
if ($conn->connect_error) {
  trigger_error('Database connection failed: ' . $conn->connect_error, E_USER_ERROR);
}

if (isset($_GET['type'])) {
	switch ($_GET['type']) {
		case 'pert_collections':// count numbers for different pert_collections
			$query = "SELECT pert_collection, COUNT(*) FROM drugs_lincs GROUP BY pert_collection"; 
			$pert_collections = query_mysql($query, $conn);
			$conn->close();
			$pert_collection_count = array();
			foreach ($pert_collections as $key => $line) {
				if (is_null($line['pert_collection'])) {
					$pert_collection_count['NA'] = (int) $line['COUNT(*)'];
				} else {
				$pert_collection_count[$line['pert_collection']] = (int) $line['COUNT(*)'];
				}
			}
			echo json_encode($pert_collection_count);
			break;
		case 'fda_collections': // number of FDA approved drugs in collections
			$query = "SELECT pert_collection, COUNT(*) FROM drugs_lincs INNER JOIN drugs_drugbank ON drugs_lincs.pubchem_cid=drugs_drugbank.pubchem_cid OR drugs_lincs.pert_iname=drugs_drugbank.name GROUP BY pert_collection"; 
			$rs = query_mysql($query, $conn);
			$conn->close();
			$fda_approved_drug_count = array();
			foreach ($rs as $key => $line) {
				if (is_null($line['pert_collection'])) {
					$fda_approved_drug_count['NA'] = (int) $line['COUNT(*)'];
				} else {
				$fda_approved_drug_count[$line['pert_collection']] = (int) $line['COUNT(*)'];
				}
			}
			echo json_encode($fda_approved_drug_count);
			break;
		case 'summary_count':
			$arr = array(); // container for all the output
			$tables = array('side_effects', 'drugs_lincs');
			foreach ($tables as $table) {
				$query = "SELECT COUNT(*) FROM $table"; // get SE count and drug count
				$count = query_mysql($query, $conn);
				$arr[$table] = $count[0]['COUNT(*)'];
			}
			$conn->close();
			echo json_encode($arr);
	}
}
?>