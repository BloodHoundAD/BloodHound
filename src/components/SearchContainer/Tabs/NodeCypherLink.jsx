import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import NodeALink from './NodeALink';

export default class NodeCypherLink extends Component {
    constructor(props) {
        super(props);
    }

    componentWillMount() {
        this.setState({
            ready: false,
            value: 0,
        });
    }

    componentWillReceiveProps(newProps) {
        if (this.props.target !== newProps.target) {
            var session = driver.session();
            if (typeof this.state.session !== 'undefined') {
                this.state.session.close();
            }

            if (newProps.target === '') {
                return;
            }

            this.setState({
                session: session,
                ready: false,
            });
            let query = this.props.baseQuery;
            if (this.props.distinct) {
                query += ' RETURN COUNT(DISTINCT(n))';
            } else {
                query += ' RETURN COUNT(n)';
            }
            let domain = '@' + newProps.target.split('@').last();
            this.setState({ domain: domain });
            session
                .run(query, {
                    name: newProps.target,
                    domain: domain,
                })
                .then(
                    function(result) {
                        this.setState({
                            value: result.records[0]._fields[0],
                            ready: true,
                        });
                    }.bind(this)
                )
                .catch(function(error) {
                    if (
                        !error.message.includes(
                            'The transaction has been terminated'
                        )
                    ) {
                        console.log(error);
                    }
                });
        }
    }

    cancelQuery() {
        if (typeof this.state.session !== 'undefined') {
            this.state.session.close();
        }
    }

    render() {
        return (
            <Fragment>
                <dt>{this.props.property}</dt>
                <dd>
                    <NodeALink
                        ready={this.state.ready}
                        value={this.state.value}
                        click={function() {
                            emitter.emit(
                                'query',
                                this.props.baseQuery + ' RETURN p',
                                {
                                    name: this.props.target,
                                    domain: this.state.domain,
                                },
                                this.props.start,
                                this.props.end
                            );
                        }.bind(this)}
                    />
                </dd>
            </Fragment>
        );
    }
}

NodeCypherLink.propTypes = {
    target: PropTypes.string.isRequired,
    property: PropTypes.string.isRequired,
    baseQuery: PropTypes.string.isRequired,
    distinct: PropTypes.bool,
    start: PropTypes.string,
    end: PropTypes.string,
};
