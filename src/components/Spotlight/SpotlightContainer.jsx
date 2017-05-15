import React, { Component } from 'react';
import GlyphiconSpan from '../GlyphiconSpan';
import Icon from '../Icon';
import SpotlightRow from './SpotlightRow'

export default class SpotlightContainer extends Component {
	constructor(props){
		super(props);
		
		this.state = {
			data: appStore.spotlightData,
			searchVal: "",
			rex: new RegExp("", 'i')
		}

		emitter.on('spotlightUpdate', function(){
			this.setState({data: appStore.spotlightData})
		}.bind(this))

		emitter.on('spotlightClick', function(){
			$(this.refs.spotlight).fadeToggle(false)
		}.bind(this))

		emitter.on('resetSpotlight', function(){
			this.setState({
				searchVal: "",
				rex: new RegExp("", 'i')
			})

		}.bind(this))
	}

	_searchChanged(event){
		this.setState({
			searchVal: event.target.value,
			rex: new RegExp(event.target.value, 'i')
		})
	}

	render() {

		return (
			<div ref="spotlight" className="spotlight">
				<div className="input-group input-group-unstyled no-border-radius">
					<GlyphiconSpan tooltip={false} classes="input-group-addon spanfix">
						<Icon glyph="search" />
					</GlyphiconSpan>
					<input onChange={this._searchChanged.bind(this)} value={this.state.searchVal} type="search" className="form-control searchbox" autoComplete="off" placeholder="Explore Nodes" data-type="search" />
				</div>

				<div className="spotlight-nodelist">
					<table data-role="table" className="table table-striped">
						<thead>
							<tr>
								<td>Node Label</td>
								<td>Collapsed Into</td>
							</tr>
						</thead>
						<tbody ref="spotlight-tbody" className="searchable">
							{Object.keys(this.state.data).map(function(key){
								var d = this.state.data[key]
								var nid = parseInt(key)
								var x = this.state.rex.test(d[0]) ? <SpotlightRow key={key} nodeId={nid} parentNodeId={d[1]} nodeLabel={d[0]} parentNodeLabel={d[2]} nodeType={d[3]} parentNodeType={d[4]} /> : null
								return x
							}.bind(this))}
						</tbody>
					</table>
				</div>
			</div>
		);
	}

	componentDidMount() {
		jQuery(this.refs.spotlight).fadeToggle(0)

		$(window).on('keyup', function(e){
            var key = e.keyCode ? e.keyCode : e.which

            if (document.activeElement === document.body && key === 32){
                $(this.refs.spotlight).fadeToggle();
            }
        }.bind(this))
	}
}
