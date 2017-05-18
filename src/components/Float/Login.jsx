import React, { Component } from 'react';

export default class Login extends Component {
	constructor(){
		super();
		this.state = {
			url: "",
			icon: null,
			loginEnabled: false,
			user: "",
			password: "",
			loginInProgress: false,
			save: false
		}
	}

	checkDBPresence(){
		var url = this.state.url;
		var icon = this.state.icon;
		var jicon = jQuery(icon)
		var btn = jQuery(this.refs.loginButton)

		if (url === ""){
			return;
		}

		jQuery(this.refs.urlspinner).toggle(true)

		url = url.replace(/\/$/, "");

		if (!url.includes(':')){
			url = url + ':7687'
		}

		if (!url.startsWith('bolt://')){
			url = 'bolt://' + url
		}

		icon.removeClass();
		icon.addClass("fa fa-spinner fa-spin form-control-feedback");
		icon.toggle(true);
		var driver = neo4j.driver(url, neo4j.auth.basic("",""), {encrypted:'ENCRYPTION_ON'})
		var session = driver.session();

		driver.onCompleted = function(){
			session.close()
			driver.close()
		}
		driver.onError = function(error){
			if (error.message.includes("authentication failure")){
				icon.removeClass();
				icon.addClass("fa fa-check-circle green-icon-color form-control-feedback");
				this.setState({loginEnabled: true, url: url})
			}else{
				icon.removeClass();
				icon.addClass("fa fa-times-circle red-icon-color form-control-feedback");
				icon.attr('data-original-title', 'No database found')
					.tooltip('fixTitle')
					.tooltip('show')
				this.setState({
					loginInProgress: false,
					loginEnabled: false
				})
			}
			session.close()
			driver.close()
		}.bind(this)
		session.run("return 1")
	}

	checkDBCreds(){
		if (this.state.loginInProgress){
			return;
		}
		this.setState({
			loginInProgress: true,
			loginEnabled: false
		})

		var btn = jQuery(this.refs.loginButton)
		var pwf = jQuery(this.refs.password)

		var driver = neo4j.driver(this.state.url, neo4j.auth.basic(this.state.user, this.state.password))
		driver.onError = function(error){
			console.log(error)
			if (error.message.includes("authentication failure")){
				btn.removeClass('activate');
				this.setState({
					loginInProgress: false,
					loginEnabled: true
				})
				pwf.attr('data-original-title', 'Invalid username or password')
					.tooltip('fixTitle')
					.tooltip('show')
			}else if (error.message.includes("too many times in a row")){
				btn.removeClass('activate');
				this.setState({
					loginInProgress: false,
					loginEnabled: true
				})
				pwf.attr('data-original-title', 'Too many authentication attempts, please wait')
					.tooltip('fixTitle')
					.tooltip('show')
			}else if (error.toString().includes('ECONNREFUSED')){
				var icon = this.state.icon
				icon.toggle('true')
				icon.removeClass();
				icon.addClass("fa fa-times-circle red-icon-color form-control-feedback");
				icon.attr('data-original-title', 'No database found')
					.tooltip('fixTitle')
					.tooltip('show')
				this.setState({
					loginInProgress: false,
					loginEnabled: false
				})
			}
			driver.close()
		}.bind(this)
		var session = driver.session();
		session.run('MATCH (n) RETURN (n) LIMIT 1')
			.subscribe({
				onError: function(error){
					btn.removeClass('activate');
					var url = this.state.url.replace('bolt://','http://').replace('7687','7474')
					if (error.fields && error.fields[0].code === "Neo.ClientError.Security.CredentialsExpired"){
						pwf.attr('data-original-title', 'Credentials need to be changed from the neo4j browser first. Go to {} and change them.'.format(url))
							.tooltip('fixTitle')
							.tooltip('show')
						this.setState({
							loginInProgress: false,
							loginEnabled: true
						})
					}
				}.bind(this),
				onNext: function(){

				},
				onCompleted: function(){
					btn.toggleClass('activate');
					btn.removeClass('btn-default')
					btn.addClass('btn-success')
					btn.html('Success!')
					this.setState({
						loginInProgress: false
					})

					var dbinfo = {
							url: this.state.url,
							user: this.state.user,
							password: this.state.password
						}
					
					if (this.state.save){
						conf.set('databaseInfo',dbinfo)	
					}

					appStore.databaseInfo = dbinfo;
					
					jQuery(this.refs.password).tooltip('hide')
					jQuery(this.refs.urlspinner).tooltip('hide')
					setTimeout(function(){
						jQuery(this.refs.outer).fadeOut(400, function(){
							renderEmit.emit('login');
						});
					}.bind(this), 1500)
					driver.close()
					global.driver = neo4j.driver(this.state.url, neo4j.auth.basic(this.state.user, this.state.password))
				}.bind(this)
			})

		btn.toggleClass('activate');

	}

	componentWillMount() {
		var c = conf.get('databaseInfo')
		if (typeof c !== 'undefined'){
			this.setState({
				url: c.url,
				user: c.user,
				password: c.password,
				save: true
			})
		}
	}

	componentDidMount() {
		jQuery(this.refs.password).tooltip({
			placement : 'right',
			title: '',
			container: 'body',
			trigger: 'manual',
			template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner tooltip-inner-custom"></div></div>'
		})
		this.setState({icon: jQuery(this.refs.urlspinner)})
		var icon = jQuery(this.refs.urlspinner)
		icon.tooltip({
			placement : 'right',
			title: '',
			container: 'body',
			delay: {show: 200, hide: 0},
			template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner tooltip-inner-custom"></div></div>'
		})
		icon.toggle(false)
		if (this.state.password !== ""){
			this.checkDBCreds();
		}
	}

	_saveChange(event) {
		this.setState({save: event.target.checked});
	}

	_urlChanged(event){
		this.setState({url: event.target.value})
	}

	_userChanged(event){
		this.setState({user: event.target.value})
		jQuery(this.refs.password).tooltip('hide')
	}

	_passChanged(event){
		this.setState({password: event.target.value})
		jQuery(this.refs.password).tooltip('hide')
	}

	_triggerLogin(e){
		var key = e.keyCode ? e.keyCode : e.which

		if (key === 13){
			this.checkDBCreds()
		}
	}

	render() {
		return (
			<div className="loginwindow">
				<div id="loginpanel" ref="outer">
					<img src="src/img/logo-white-transparent-full.png" />
					<div className="text-center">
						<span>Log in to Neo4j Database</span>
					</div>
					<form>
						<div className="form-group has-feedback">
							<div className="input-group">
								<span className="input-group-addon" id="dburladdon">
									Database URL
								</span>
								<input ref="url" onFocus={function(){jQuery(this.state.icon).tooltip('hide');}.bind(this)} onBlur={this.checkDBPresence.bind(this)} onChange={this._urlChanged.bind(this)} type="text" className="form-control" value={this.state.url} placeholder="bolt://localhost:7687" aria-describedby="dburladdon" />
								<i ref="urlspinner" className="fa fa-spinner fa-spin form-control-feedback" />
							</div>
							<div className="input-group spacing">
								<span className="input-group-addon" id="dbuseraddon">DB Username</span>
								<input ref="user" type="text" value={this.state.user} onKeyUp={this._triggerLogin.bind(this)} onChange={this._userChanged.bind(this)} className="form-control" placeholder="neo4j" aria-describedby="dbuseraddon" />
							</div>
							<div className="input-group spacing">
								<span className="input-group-addon" id="dbpwaddon">DB Password</span>
								<input ref="password" value={this.state.password} onKeyDown={this._triggerLogin.bind(this)} onChange={this._passChanged.bind(this)} type="password" className="form-control" placeholder="neo4j" aria-describedby="dbpwaddon" />
							</div>
							<div className="savecontainer">
								<div className="checkbox logincheck">
									<label><input value={this.state.save} onChange={this._saveChange.bind(this)} ref="save" type="checkbox" />Save Password</label>
								</div>
								<div className="buttoncontainer">
									<button ref="loginButton" disabled={!this.state.loginEnabled} type="button" onClick={this.checkDBCreds.bind(this)} className="btn btn-primary loginbutton has-spinner">
										Login
										<span className="button-spinner">
											<i className="fa fa-spinner fa-spin" />
										</span>
									</button>
								</div>
							</div>
						</div>
					</form>
				</div>
			</div>
		);
	}
}
