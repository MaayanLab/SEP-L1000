<?php 
require_once 'login.php';
// function query_mysql($query, $params, $conn, $type='s') 
// {
//     $stmt = $conn->prepare($query);
//     if($stmt === false) {trigger_error('Wrong SQL query: ' . $query . ' Error: ' . $conn->error, E_USER_ERROR);}
//     if (is_array($params)) {
//         $refs = array(); // convert $params to an array of references.
//         foreach ($params as $key => $value) {
//             $refs[$key] = &$params[$key];
//         }
//     	call_user_func_array(array($stmt, "bind_param"), array_merge(array($type), $refs));
//     } else {
//         if ($params != '') {
//             $stmt->bind_param($type, $params);
//         }
//     }
//     $stmt->execute();
//     $rs = $stmt->get_result();
//     $arr = $rs->fetch_all(MYSQLI_ASSOC);
//     $rs->free();
//     $stmt->close();
// 	return $arr;
// }

function query_mysql($query, $conn)
{   
    $rs = $conn->query($query);
    $arr = array();
    while ($row = $rs->fetch_assoc()) {
        array_push($arr, $row);
    }
    $rs->close();
    return $arr;
}

function send_get_data($url, $data)
{
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json',
        'Content-Length: '.strlen($data)) );

    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPGET,true);
    $result = curl_exec($ch);
    if ($result === false) {
        print_r(curl_errno($ch));
    }
    curl_close($ch);
    return $result;
}
?>