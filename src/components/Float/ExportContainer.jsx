import React, { Component } from 'react';

export default class ExportContainer extends Component {
	_dismiss(){
		$(this.refs.outer).fadeToggle(false)
	}

	componentDidMount() {
		$(this.refs.outer).draggable()
	}

	render() {
		return (
			<div className="floating-div" ref="outer">
				<div className="panel-heading">
					Export Graph
					<button type="button" className="close" onClick={this._dismiss.bind(this)} aria-label="Close">
						<span aria-hidden="true">&times;</span>
					</button>
				</div>

				<div className="panel-body">
					<div className="list-group">
						<a href="#" id="exportjson" className="list-group-item active">
							<h4 className="list-group-item-heading">Export to JSON</h4>
							<p className="list-group-item-text">
								Use this format to export data and re-import it later
							</p>
						</a>

						<a href="#" id="exportimage" className="list-group-item">
							<h4 className="list-group-item-heading">Export to Image</h4>
							<p className="list-group-item-text">
								Use this format to export data and view it as an image
							</p>
						</a>
					</div>

					<div style={{textAlign: "center"}}>
						<button id="exportFinishButton" className="btn btn-lg">Export Data</button>
					</div>
				</div>
			</div>
		);
	}
}
