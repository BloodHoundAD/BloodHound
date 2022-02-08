import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class ProgressBarMenuButton extends Component {
    constructor(props) {
        super(props);

        this.state = {
            expanded: false,
        };
    }

    componentDidMount() {
        $(this.refs.btn).html('{}%'.format(this.props.progress));
        $(this.refs.btn).css('padding', '6px 0px 6px 0px');
        $(this.refs.btn).css('width', '41px');
    }

    componentWillReceiveProps(nextProps) {
        if (this.state.expanded) {
            const template = `<div className="progress" style="margin-bottom:0px"> 
                <div className="progress-bar progress-bar-striped active" role="progressbar" aria-value-now={} aria-value-max="100" style="width:{}%">
                </div>
                <span>
                    {}%
                </span>
            </div>`.formatAll(nextProps.progress);
            $(this.refs.btn).html(template);
        } else {
            $(this.refs.btn).html('{}%'.format(nextProps.progress));
        }

        this.forceUpdate();
    }

    shouldComponentUpdate(_nextProps, _nextState) {
        return true;
    }

    _leave(e) {
        this.setState({ expanded: false });
        const target = $(e.target);
        target.html('{}%'.format(this.props.progress));
        target.animate(
            {
                width: '41px',
            },
            100
        );
    }

    _enter(e) {
        this.setState({ expanded: true });
        const target = $(e.target);
        const template = `
            <div className="progress" style="margin-bottom:0px"> 
                <div className="progress-bar progress-bar-striped active" role="progressbar" aria-value-now={} aria-value-max="100" style="width:{}%">
                </div>
                <span>
                    {}%
                </span>
            </div>
        `.formatAll(this.props.progress);

        target.html(template);
        target.animate(
            {
                width: '150px',
            },
            100
        );
    }

    render() {
        return (
            <button
                ref='btn'
                onClick={this.props.click}
                onMouseLeave={this._leave.bind(this)}
                onMouseEnter={this._enter.bind(this)}
                className='btn'
            />
        );
    }
}

ProgressBarMenuButton.propTypes = {
    progress: PropTypes.number.isRequired,
    click: PropTypes.func.isRequired,
};
