<?php


class Model 
{	
	private $host;
	private $databaseName;
	private $username;
	private	$password;
	public $db;
	
	function __construct ($host = 'localhost',$databaseName = 'chat',$username = 'root',$password = '') {
		$this->host = $host;
		$this->databaseName = $databaseName;
		$this->username = $username;
		$this->password = $password;
		$this->db = new PDO('mysql:host='.$host.';dbname='.$databaseName,$username,$password);
	}
	
	public function login($login, $password){
		$sql = "SELECT * FROM `users` WHERE login =:login And password =:password LIMIT 1";
		$password = md5($password);
		$result = $this->db->prepare($sql);
		$result->bindValue(':login',$login);
		$result->bindValue(':password',$password);
		if (!($login)||!($password)) {
			$answer = "{success:false}";
		} else {
			$result->execute();
			if (!$result->rowCount()){
			$answer = "{success:false}";
			} else {
				$arr[] = $result->fetchAll(PDO::FETCH_OBJ);
				$answer = "{success:true, rows:".json_encode($arr[0]).'}';
			}
		}
		return $answer;
	}
	
	public function register($regName,$regLogin,$regPassword) {
		$sql = "INSERT INTO `users` VALUES ('',:username,:login,:password,'','')";
		$response = "SELECT * FROM `users` WHERE (`username`=:username And `login`=:login And `password`=:password)";
		$result = $this->db->prepare($sql);
		$regPassword = md5($regPassword);	
		$result->bindValue(':username',$regName);
		$result->bindValue(':login',$regLogin);
		$result->bindValue(':password',$regPassword);
		if (!($regName)||!($regLogin)||!($regPassword)) {
			$answer = "{success:false}";
		} else {
			$result->execute();
			$result = $this->db->prepare($response);
			$result->bindValue(':username',$regName);
			$result->bindValue(':login',$regLogin);
			$result->bindValue(':password',$regPassword);
			$result->execute();
			if (!$result->rowCount()){
				$answer = "{success:false}";
			} else {
				$arr[] = $result->fetchAll(PDO::FETCH_OBJ);
				$answer = "{success:true, rows:".json_encode($arr[0]).'}';
			}
		}
		return $answer;
	}
	
	public function ping($myID,$curdate) {
		$sql = "UPDATE `users` SET `lastoltime`=:curdate WHERE `id`=:myID";
		$result = $this->db->prepare($sql);
		$result->bindValue(':myID',$myID);
		$result->bindValue(':curdate',$curdate);
		if (!($myID)) {
			$answer = "{success:false}";
		} else {
			$result->execute();
			$answer = $this->getUnreadMsg($myID);
		};
		return $answer;
	}
	
	public function getUsers($group,$myID) {
		if ($group == 0) {
			$sql = "SELECT `id`,`username`,`login`,`lastoltime`,`is_admin` FROM `users`";
		} else if ($group == 1) {
			$sql = "SELECT `id`,`username`,`login`,`lastoltime`,`is_admin` FROM `users` WHERE `is_admin`=1 OR `id`=:myID";
		} else if ($group == 2) {
			$sql = "SELECT `id`,`username`,`login`,`lastoltime`,`is_admin` FROM `users` WHERE `is_admin`=0";
		};
		if ($myID == 1) {
			$sql = "SELECT * FROM `users`";
		};
		$result = $this->db->prepare($sql);
		$result->bindValue('myID',$myID);
		$result->execute();
		if (!$result->rowCount()){
			$answer = "{success:false}";
		} else {
			$arr[] = $result->fetchAll(PDO::FETCH_OBJ);
			$answer = "{success:true,rows:".json_encode($arr[0]).'}';
		}
		return $answer;
	}
	
	public function getMessages($user_id) {
		$sql = "SELECT * FROM `chat` WHERE (user_id_from = :user OR user_id_to = :user) ORDER BY msg_datetime DESC";
		$result = $this->db->prepare($sql);
		$result->bindValue(':user',$user_id);
		if (!$user_id) {
			$answer = "{success:false}";
		} else {
			$result->execute();
			if (!$result->rowCount()){
			$answer = "{success:false}";
			} else {
				$arr[] = $result->fetchAll(PDO::FETCH_OBJ);
				$answer = "{success:true,rows:".json_encode($arr[0]).'}';
			}
		}
		return $answer;
	}
	
	public function getUnreadMsg($user_id_to) {
		$sql = "SELECT * FROM `chat` WHERE (`user_id_to`=:user_id_to And `already_read`=0)";
		$result = $this->db->prepare($sql);
		$result->bindValue(':user_id_to',$user_id_to);
		if (!$user_id_to) {
			$answer = "{success:false}";
		} else {
			$result->execute();
			if (!$result->rowCount()) {
				$answer = "{success:false}";
			} else {
				$answer = "{success:true,rows:".json_encode($arr[0]).'}';
			}
		};
		return $answer;
	}
	
	public function sendMsg($user_id_from, $user_id_to, $message) {
		$sql = "INSERT INTO `chat`.`chat` VALUES (null,:user_id_from,:user_id_to,:message,null,false)";
		$response = "SELECT * FROM `chat` WHERE (`user_id_from`=:user_id_from And `user_id_to`=:user_id_to And `message`=:message)";
		$result = $this->db->prepare($sql);
		$result->bindValue(':user_id_from',$user_id_from);
		$result->bindValue(':message',$message);
		$result->bindValue(':user_id_to',$user_id_to);
		if (!($user_id_from)And!($user_id_to)) {
			Echo "{success:false}";
		} else {
			$result->execute();
			$result = $db->prepare($response);
			$result->bindValue(':user_id_from',$user_id_from);
			$result->bindValue(':message',$message);
			$result->bindValue(':user_id_to',$user_id_to);
			$result->execute();
			if (!$result->rowCount()){
				$answer = "{success:false}";
			} else {			
				$arr[] = $result->fetchAll(PDO::FETCH_OBJ);
				$answer = "{success:true,rows:".json_encode($arr[0]).'}';
			}
		}
		return $answer;
		
	}
	public function updateUnread ($user_id_from,$user_id_to) {
		$sql = "UPDATE `chat` SET `already_read`=true WHERE (`user_id_from`=:myID And `user_id_to`=:toID)";
		$result = $this->db->prepare($sql);
		$result->bindValue(':myID',$user_id_from);
		$result->bindValue(':toID',$user_id_to);
		if (!($user_id_from)And!($user_id_to)) {
			Echo "{success:false}";
		} else {
			$result->execute();
			$answer = "{success:true}";
		}
		return $answer;
	}

	public function rootUpdate($id,$field,$value) {
		$sql = "UPDATE `users` SET `".$field."`=:value WHERE (`id`=:id)";
		if ($field == 'password') {$value = md5($value);};
		$result = $this->db->prepare($sql);
		$result->bindValue(':id',$id);
		$result->bindValue(':value',$value);
		if ((!IsSet($id))And (!IsSet($value))) {
			$answer = "{success:false}";
			
		} else {
			$result->execute();
			$answer = "{success:true}";
		}
		return $answer;
	}
	
	public function rootAddUser () {
		$sql = "INSERT INTO `chat`.`users` VALUES (null,'New user','New user','','','')";
		$result = $this->db->prepare($sql);
		$result->execute();
		$answer = "{success:true}";
		return $answer;
	}
	
	public function rootRemoveUser($id) {
		$sql_msg = "DELETE FROM `chat` WHERE `user_id_from`=:id";
		$sql = "DELETE FROM `users` WHERE `id`=:id ";
		$result_msg = $this->db->prepare($sql_msg);
		$result = $this->db->prepare($sql);
		$result_msg->bindValue(':id',$id);
		$result->bindValue(':id',$id);
		if (!($id)) {
			Echo "{success:false}";
		} else {
			$result_msg->execute();
			$result->execute();
			$answer = "{success:true}";
		}
	}
}
class Controller 
{
	private $model;
	public function __construct($model) {
		$this->model = $model;
	}
	public function action ($action) {
		if ($action == 'login') {
			$login = $_REQUEST['login'] ? $_REQUEST['login'] : 0;
			$password = $_REQUEST['password'] ? $_REQUEST['password'] : 0;
			echo $this->model->login($login,$password);
		} else if ($action == 'ping') {
			$myID = $_REQUEST['ID'] ? $_REQUEST['ID'] : 0;	
			$curdate = $_REQUEST['curdate'] ? $_REQUEST['curdate'] : 0;
			echo $this->model->ping($myID,$curdate);
		} else if ($action == 'send') {
			$user_id_from = $_REQUEST['id'] ? $_REQUEST['id'] : 0;
			$user_id_to = $_REQUEST['toid'] ? $_REQUEST['toid'] : 0;
			$message = $_REQUEST['message'] ? $_REQUEST['message'] : 0;
			echo $this->model->sendMsg($user_id_from,$user_id_to,$message);
		} else if ($action == 'register') {
			$username = $_REQUEST['regname'] ? $_REQUEST['regname'] : 0;
			$login = $_REQUEST['reglogin'] ? $_REQUEST['reglogin'] : 0;
			$password = $_REQUEST['regpassword'] ? $_REQUEST['regpassword'] : 0;
			echo $this->model->register($username,$login,$password);
		} else if ($action == 'getusers') {
			$group = $_REQUEST['group'];
			$myID = $_REQUEST['ID']; 
			echo $this->model->getUsers($group,$myID);
		} else if ($action == 'getmessages') {
			$user_id = $_REQUEST['user_id'] ? $_REQUEST['user_id'] : 0;	
			echo $this->model->getMessages($user_id);
		} else if ($action == 'updateunread') {
			$user_id_from = $_REQUEST['user_id_from'] ? $_REQUEST['user_id_from'] : 0;	
			$user_id_to = $_REQUEST['user_id_to'] ? $_REQUEST['user_id_to'] : 0;
			echo $this->model->updateUnread($user_id_from,$user_id_to);
		} else if ($action == 'rootupdate') {
			$id = $_REQUEST['id'] ? $_REQUEST['id'] : 0;
			$field = $_REQUEST['field'] ? $_REQUEST['field'] : 0;
			$value = $_REQUEST['value'] ? $_REQUEST['value'] : 0;
			echo $this->model->rootUpdate($id,$field,$value);
		} else if ($action == 'rootadduser') {
			echo $this->model->rootAddUser($db);
		} else if ($action == 'rootremoveuser') {
			$id = $_REQUEST['id'] ? $_REQUEST['id'] : 0;
			echo $this->model->rootRemoveUser($id);
		}
	}
};

$conf = parse_ini_file('config.ini');
$model = new Model($conf['host'],$conf['database'],$conf['username'],$conf['password']);
$controller = new Controller($model);
$controller->action($_REQUEST['action']);

?>


	