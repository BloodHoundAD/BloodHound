import React, { Component } from 'react';
import GlyphiconSpan from '../glyphiconspan';
import Icon from '../icon';

export default class SpotlightContainer extends Component {
	constructor(props){
		super(props);
		
		this.state = {
			data: {}
		}
	}

	render() {
		return (
			<div ref="spotlight" className="spotlight">
				<div className="input-group input-group-unstyled no-border-radius">
					<GlyphiconSpan tooltip={false} classes="input-group-addon spanfix">
						<Icon glyph="search" />
					</GlyphiconSpan>
					<input id="spotlight-search" type="search" className="form-control searchbox" autoComplete="off" placeholder="Explore Nodes" data-type="search" />
				</div>

				<div className="spotlight-nodelist">
					<table data-role="table" className="table table-striped" data-filter="true" data-input="#spotlight-search">
						<thead>
							<tr>
								<td>Node Label</td>
								<td>Collapsed Into</td>
							</tr>
						</thead>
						<tbody ref="spotlight-tbody" className="searchable">
						</tbody>
					</table>
				</div>
			</div>
		);
	}

	componentDidMount() {
		jQuery(this.refs.spotlight).fadeToggle(0)
	}
}
