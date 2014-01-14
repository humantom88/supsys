var chat =  {
	exec: function(){

		var myID;
		var toID;
		document.title = 'Acme\'s Support System';
		/*
		* RECORDS
		*/
		var Messagebox = Ext.data.Record.create([
			'msg_id',
			'user_id_from',
			'user_id_to',
			'message',
			'msg_datetime',
			'already_read'
		]);
		var Users = Ext.data.Record.create([
			'id',
			'username',
			'login',
			'lastoltime',
			'is_admin',
			'is_online'
		]);
		/*
		* STORES
		*/
		var store = new Ext.data.Store({
			url: 'controller.php',
			reader: new Ext.data.JsonReader({
				root:'rows',
				idProperty:'msg_id'
				}, Messagebox),
			//groupField: 'is_admin',
			autoLoad: {
				params: {
					action: 'getmessages',
					user_id: myID
				}
			},
			listeners: {
				load: function(st,rec,opt) {
					store.filterBy(function(record,id)	{
						if ((record.get('user_id_to')==toID) && (record.get('user_id_from')==myID) 
						  ||(record.get('user_id_to')==myID) && (record.get('user_id_from')==toID)) {
							return true;
						};
					}); 
				}
			}
		});
		var userstore = new Ext.data.Store({
			url: 'controller.php',
			reader: new Ext.data.JsonReader({
				root:'rows',
				idProperty:'id'
				}, Users),
			listeners: {
				load: function(st,rec,opt) {			
					userstore.each(function(record,idx) {
							//Online/offline users definition function
							var nowDate = new Date();
							var lastOlDate = new Date(record.get('lastoltime'));
							if ((nowDate - lastOlDate)<=12000) {
								record.set('is_online', true);
								record.commit();
							} else {
								record.set('is_online', false);
								record.commit();
							};
						}
					);
				}	
			},
			autoLoad: {
				params: {
				action: 'getusers',
				/* group = 0 - All Accounts, 1 - Admins Only, 2 - Users Only */
				group: 1,
				ID: myID
				}
			}
		});		
		/*
		* GRID RENDER FUNCTIONS
		*/
		//Message grid's renderer
		function from_tagline(val, x, rec){
			if (rec.get('already_read')==1) {
				return '<b>'+userstore.query('id', rec.get('user_id_from')).items[0].json.login+'</b> '+'('+rec.get('msg_datetime')+')<br><big>'+val+'</big>';
			} else {
				return '<b>'+userstore.query('id', rec.get('user_id_from')).items[0].json.login+'</b> '+'('+rec.get('msg_datetime')+') !<br><i>'+val+'</i>';
			}
		};
		//User grid's renderer
		function cover_image(val,x,rec)	{
			var arr = store.queryBy(function(record,id){
				if ((record.get('already_read')==0)&&(record.get('user_id_to')==myID)&&(record.get('user_id_from')==rec.get('id'))) {
					return true;
				};
			});
			var recordView;
			if (rec.get('is_online') == true && rec.get('is_admin')== false) {
				recordView = '<img src="images/xline1.png"><span style="font-size: 16"> '+rec.get('login')+'</span>';
			} else if (rec.get('is_online') == false && rec.get('is_admin')== false) {
				recordView = '<img src="images/xline0.png"><span style="font-size: 16"> '+rec.get('login')+'</span>';
			} else if (rec.get('is_online') == true && rec.get('is_admin')== true) {
				recordView = '<img src="images/suponl.bmp"><span style="font-size: 16"> '+rec.get('login')+'</span>';
			} else if (rec.get('is_online') == false && rec.get('is_admin')== true) {
				recordView = '<img src="images/supoff.bmp"><span style="font-size: 16"> '+rec.get('login')+'</span>';
			};
			if (arr.items.length != 0) {recordView += '(' + arr.items.length + ' new message(s))'};
			return recordView;
		};
		/*
		* GRIDS
		*/
		function constructUserGrid (logIn) {
			var pan = new Ext.grid.GridPanel({
				id: logIn,
				store: store,	
				closable: true,
				autoScroll: true,
				viewConfig: {
					forceFit:true,
					enableNoGroups: false,
					autoFill: true,
					scrollOffset:0,
					showGroupName: false
				},
				colModel: new Ext.grid.ColumnModel({
					autoExpandColumn: 'message',
					columns: [
						{header: "ID", dataIndex: 'msg_id', hidden: true },
						{header: "From", dataIndex: 'user_id_from', hidden: true}, 
						{header: "To", dataIndex: 'user_id_to', hidden: true},
						{header: "Messages", dataIndex: 'message', renderer:from_tagline},
						{header: "DateTime", dataIndex: 'msg_datetime', hidden: true, renderer: Ext.util.Format.dateRenderer('Y/m/d/h/m/s')},
						{header: "Already_read", dataIndex: 'already_read', hidden: true}
					]
				}),
				border: false,
				autoScroll:true,
				title: logIn
			});
			return pan;
		};

		var usersGrid = new Ext.grid.GridPanel({
			store: userstore,
			layout: 'fit',
			colModel: new Ext.grid.ColumnModel({
				autoExpandColumn: 'login',
				columns: [
					{header: "ID", dataIndex: 'id', hidden: true },
					{header: "Username", dataIndex: 'username', hidden: true}, 
					{header: "Available Supporters", dataIndex: 'login',width: 190, hidden: false, renderer: cover_image},
					{header: "Lastoltime", dataIndex: 'lastoltime', hidden: true, renderer: Ext.util.Format.dateRenderer('Y/m/d/h/m/s')},
					{header: "IsAdmin",dataIndex: 'is_admin', groupName: 'Admins', hidden: true},
					{header: "IsOnline",dataIndex: 'is_online',hidden: true}
				]
			}),
			listeners: {
				celldblclick:{ 
					fn:	function(grid, rowIndex, columnIndex,e) {
						var logIn = grid.getSelectionModel().getSelected().get('login');
						if (!tabs.getItem(logIn)){
							tabs.add(constructUserGrid(logIn)).show();
						} else {
							tabs.getItem(logIn).show();
						}
					}
				}
			},
			margin: '5 5 5 5'
		});	
		var tabs = new Ext.TabPanel({
			resizeTabs: true,
			ref: 'tabpan',
			enableTabScroll: true,
			activeTab: 0,
			defaults: { autoScroll: true },
			items:{
				title: 'Welcome Page',
				layout: 'fit',
				closable: false
			},
			listeners: {
				tabchange: function(tab,selpan) {
					if (selpan.title != "Welcome Page" ) {
						toID = userstore.query('login', selpan.title).items[0].id;
						if (tabs.getActiveTab().title != "Welcome Page") {
							setReadMsg(userstore.query('login', tabs.getActiveTab().id).items[0].json.id);
						};
						store.load({params: {user_id: myID, action: 'getmessages'}});
					}
				}
			}
		});
		function addTab(tabName) {
			var tab=tabs.add({
				title: tabName,
				layout: 'fit',
				iconCls: 'icon-tab',
				bodyStyle:'padding: 5px',
				closable: true
			});
			tab.show();
		};
		var registerForm = new Ext.FormPanel({
		  url:'controller.php',
		  frame: true,
		  items: [
			  {
				  xtype: 'textfield',
				  ref: 'regUsername',
				  fieldLabel: 'Username',
				  allowBlank: false,
				  anchor: '90%'
			  },{
				  xtype: 'textfield',
				  ref: 'regLogin',
				  fieldLabel: 'Login',
				  allowBlank:false,
				  anchor: '90%'
			  },{
				  xtype: 'textfield',
				  fieldLabel:'Password',
				  ref: 'regPassword',
				  inputType:'password',
				  anchor: '90%',
				  allowBlank:false
			  }
		  ],
		  buttons: [
			  {
				text: 'Register me',
				handler: function() {
					registerForm.getForm().submit({
						waitTitle: 'Please wait...',
						waitMsg: 'Trying to login...',
						params: {
						  regname: registerForm.regUsername.getValue(),
						  reglogin: registerForm.regLogin.getValue(),
						  regpassword: registerForm.regPassword.getValue(),
						  action: 'register'
						},
						success: function(form,action){
							var jsonResp = Ext.decode(action.result.success);
							if (jsonResp == true) {
								alert ('Registration successfully passed. Please Login.');
							}
							registerWindow.hide();
							loginWindow.show();
						},
						failure: function (form,action){
							alert ('Some problems. Please contact admin (89114425750)');
							registerWindow.hide();
							loginWindow.show();
						}
					});
				}
			  }
		  ]
		});
		/*
		* Login Form Panel
		*/
		var loginForm = new Ext.FormPanel({
		  url:'controller.php',
		  frame: true,
		  items: [
			  {
				  xtype: 'textfield',
				  ref: 'submitlogin',
				  fieldLabel: 'Login',
				  allowBlank:false,
				  anchor: '90%'
			  },{
				  xtype: 'textfield',
				  fieldLabel:'Password',
				  ref: 'password',
				  name:'password',
				  inputType:'password',
				  anchor: '90%',
				  allowBlank:false
			  }
		  ],
		  buttons: [
			  {
				text: 'Register',
				handler: function() {
				loginWindow.hide();
				registerWindow.show();
				}
			  },
			  {
				text: 'Login',
				handler: function() {
					loginForm.getForm().submit({
						waitTitle: 'Please wait...',
						waitMsg: 'Trying to login...',
						params: {
						  login: loginForm.submitlogin.getValue(),
						  password: loginForm.password.getValue(),
						  action: 'login'
						},
						success: function(form,action){
							var jsonResp = Ext.decode(action.result.success);
							if (jsonResp == true)	{
								myID = action.result.rows[0].id;
								if (myID == 1) {
									rootWindow.show();
									loginWindow.hide();
								}
								alert('Welcome to the ACME Corp. Support System, ' + action.result.rows[0].login);
								userstore.reload({params: {action: 'getusers', group:1, ID: myID}});
								loginWindow.hide();
							}
						},
						failure: function (form,action){
							alert ('Some problems. Check your registration data or please contact admin (89114425750)');
						}
					});
				}
			  }
		  ]
		});
		var record_edit = new Ext.form.TextField();
		var rootForm = new Ext.FormPanel({
		  url: 'controller.php',
		  frame: true,
		  layout: 'fit',
		  items: [
			  {	
				xtype: 'editorgrid',
				store: userstore,
				clickstoEdit: 1,
				width: 520,
				height: 200,
				ref: 'rootGrid',
				selModel: new Ext.grid.RowSelectionModel({
					singleSelect: true
				}),
				viewConfig: {
					forceFit: true,
					autoFill: true,
					scrollOffset: 0
				},
				columns: [
					{header: "ID", dataIndex: 'id', editor: record_edit},
					{header: "Username", dataIndex: 'username', editor: record_edit}, 
					{header: "Login", dataIndex: 'login', editor: record_edit},
					{header: "Password", dataIndex: 'password', editor: record_edit},
					{header: "Lastoltime", dataIndex: 'lastoltime',renderer: Ext.util.Format.dateRenderer('Y/m/d/h/m/s')},
					{header: "IsAdmin",xtype:'numbercolumn',format: '0',dataIndex: 'is_admin', editor: record_edit},
					{header: "IsOnline",dataIndex: 'is_online'}
				],
				listeners: {
					afteredit: function(e){
						Ext.Ajax.request({
							url: 'controller.php',
							params: {
								action:'rootupdate',
								id: e.record.id,
								field: e.field,
								value: e.value
							},
							success: function(resp,opt) {
								e.record.commit();
							},
							failure: function(resp,opt) {
								e.record.reject();
							}
						});
					}
				},
				tbar: [{
					text: 'Add User',
					handler: function() {
						rootForm.rootGrid.getStore().insert(0, new Users({
							username: 'New user',
							is_admin: false
						}));
						Ext.Ajax.request({
							url: 'controller.php',
							params: {
								action:'rootadduser'
							},
							success: function(resp,opt) {
								userstore.reload();
							},
							failure: function(resp,opt) {}
						});
					}
				},{
					text: 'Remove User',
					handler: function() {
						var sm = rootForm.rootGrid.getSelectionModel();
						if(sm.hasSelection()){		
							sel = sm.getSelected();
							Ext.Msg.show({
								title: 'Remove User?',
								buttons: Ext.MessageBox.YESNOCANCEL,
								msg: 'Do You Want to Remove '+sel.data.id+'? (All messages from this user will be lost...)',
								fn: function(btn) {
									if (btn=='yes') {
										Ext.Ajax.request({
											url: 'controller.php',
											params: {
												action: 'rootremoveuser',
												id: sel.data.id
											},
											success: function (resp,opt) {
												rootForm.rootGrid.getStore().remove(sel);
											},
											failure: function(resp,opt) {
												Ext.Msg.alert('Error','Unable to delete user');									
											}
										})
									}
								}
							})
						}
					}
				},{
					text: 'Refresh',
					handler: function() {
						userstore.reload();
					}
				},{
					text: 'Logout',
					handler: function() {
						myID = null;
						rootWindow.hide();
						loginWindow.show();
					}
				}],
				margin: '0 0 0 0'	  
			  }
		  ]
		});
		/*
		*  Login and Register Windows
		*/
		var loginWindow = new Ext.Window({
			frame:true,
			title: 'Welcome to ACME Corp. Please login.',
			width:330,
			closable: false,
			items: loginForm
		});
		var registerWindow = new Ext.Window({
			frame:true,
			title: 'Please fill in the fields and press "Register" button.',
			width:330,
			closable: false,
			items: registerForm
		});
		var rootWindow = new Ext.Window ({
			title: 'The Root Interface',
			closable: false,
			layout: 'fit',
			split: true,
			width: 600,
			height: 400,
			items: rootForm
		});
		/*
		* Functions
		*/

		function setReadMsg (user_id) {
			if (user_id != null) {
				Ext.Ajax.request({
					url:'controller.php',
					params: {
						action: 'updateunread',
						user_id_from: user_id ? user_id : 0,
						user_id_to: myID
					}
				});
			} else {
			};
		};

		function getUnreadMsgCount (myID) {
			return store.queryBy(function(record,id) {
			if (record.get('already_read')==0&&(record.get('user_id_to')==myID)){
				return true; }
			}).getCount();
		};

		function insertMsg2Store(store, json){
			store.insert(0, new Messagebox ({
				msg_id: json.msg_id,
				user_id_from: json.user_id_from,
				user_id_to: json.user_id_to,
				message: json.message,
				msg_datetime: json.msg_datetime,
				already_read: json.already_read
			})); 
		};

		function updateTitle(myID) {
			if (myID != null && getUnreadMsgCount(myID) != 0) {
				document.title = 'You Have '+getUnreadMsgCount(myID)+' new Message(s)';
			} else {
				document.title = 'Acme\'s Support System';
			}
		};
		/*
		*	Ext.onReady()
		*/
		Ext.onReady(function(){
			Ext.QuickTips.init();
			loginWindow.show();	
		var viewport = new Ext.Viewport({
				renderTo: 'body',
				layout: "border",
				defaults: { bodyStyle: 'padding:1px;'},
				items: [{ 
					region: 'west',
					layout:'fit',
					split: true,
					collapsible: true,
					collapseMode: 'mini',
					title: 'Supporters',
					name: 'supporters',
					width: 200,
					minSize: 200,
					items: [usersGrid],
					tbar: [{
						text:'logout',
						handler: function() {
							myID = null;
							loginWindow.show();
							Ext.viewport.hide();
						},
						align: 'right'
					}],
					margins: '5 0 0 5'
				},{
					region: 'center',
					title: 'Support Chat',
					layout: 'fit',			
					items: [tabs],
					closable: true,
					ref: 'center',
					margins: '5 5 0 0'
				},{
					region: 'south',
					height: 150,
					title: 'Your Message:',
					name: 'MessageWindow',
					split: true,
					layout: {type:'vbox',align: 'stretch'},
					ref: 'south',
					items: [
						{
							xtype: 'textarea',
							title: 'editor',
							value: 'If you have a problem, please describe it over here.',
							ref: 'editor',
							align: 'stretch',
							height: 85,
							autoScroll: true,
						},{
							xtype: 'panel',
							align: 'stretch',
							border: false,
							buttons:[
								{
								text: 'Send',
								handler: function() {
									if (userstore.query('is_online', true).getCount()) {
										Ext.Ajax.request({
											url: 'controller.php',
											params: {
												action: 'send',
												id: myID,
												toid: toID,
												message: viewport.south.editor.getValue()
											},
											success: function(resp,opt) {	
												var jsonResp = Ext.decode(resp.responseText).rows[0];
												insertMsg2Store(store,jsonResp);
											},
											failure: function(resp,opt) {
												alert('Some troubles with a server, please email: humantom88@gmail.com');
											}
										})
									} else {
										alert ('Sorry, but all supporters are offline for now, please try again in 10 minutes.');
									}	
								}
							}]
						}
					]
				}],
				margins: '0 5 10 5'
			});
		});
		/*
		* Online status monitoring
		*/
		var interval = setInterval(function() {	
			var myDate = new Date();
			Ext.Ajax.request({
				url: 'controller.php',
				params: {
					curdate: myDate,
					ID: myID,
					action: 'ping'
				},
				success: function(resp,opt)	{
					console.log('...ping...');
					if (tabs.getActiveTab().title != "Welcome Page") {
						setReadMsg(userstore.query('login', tabs.getActiveTab().id).items[0].json.id);
					};
					if (userstore.query('id',myID).items[0] !== undefined) { 
						if (userstore.query('id',myID).items[0].json.is_admin != 0) {
							userstore.load({params: {action: 'getusers', group:0, ID: myID}});	
						};
					} else {
						userstore.load({params: {action: 'getusers', group:1, ID: myID}});
					}
					store.reload();
					if (myID!=1) {	userstore.reload() };
				},
				failure: function(resp,opt)	{
				}
			});
		},10000);
	}
}
chat.exec();