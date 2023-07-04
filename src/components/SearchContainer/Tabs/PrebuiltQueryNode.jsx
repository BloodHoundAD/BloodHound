import React, { Component, useContext } from 'react';
import './PrebuiltQueries.module.css';

import { motion } from 'framer-motion';
import { AppContext } from '../../../AppContext';

import GlyphiconSpan from '../../GlyphiconSpan';
import Icon from '../../Icon';
import { withAlert } from 'react-alert';

export default class PrebuiltQueryNode extends Component {
    static contextType = AppContext;

    constructor(props) {
        super(props)

        this.state = {
            hovered: false
        }
    }

    enterQuery() {
        this.setState({
            hovered: true
        })
    };


    exitQuery() {
        this.setState({
            hovered: false
        })
    };
    
    render() {
        let c;

        c = function () {
            if (appStore.prebuiltQuery.length === 0) {
                appStore.prebuiltQuery = JSON.parse(
                    JSON.stringify(this.props.info.queryList)
                );
                emitter.emit('prebuiltQueryStart');
            }
        }.bind(this);

        const copyQuery = (e) => {
            let containsProps = false;
            let queries = []
            let queryList = this.props.info.queryList

            let containsMultipleQueries = queryList.length > 1;

            for (var i = 0; i < queryList.length; i++) {
                let query = queryList[i].query;

                if (queries.length > 0) {
                    queries.push("");
                }

                let props = queryList[i].props;
                if (props) {
                    containsProps = true;
                    for (const [key, value] of Object.entries(props)) {
                        query = query.replace(`\$${key}`, JSON.stringify(value))
                    }
                }
                queries.push(query);
            }

            navigator.clipboard.writeText(queries.join("\n"))

            this.props.alert.info("Copied query")

            if (containsProps) {
                this.props.alert.show(<span><b>WARNING</b> Query contains props. These might not be properly formatted</span>, { type: 'error' })
            }

            if (containsMultipleQueries) {
                this.props.alert.show(<span><b>WARNING</b> Query contains multiple queries</span>, { type: 'error' })
            }
        };

        const variants = {
            open: { height: 'auto', opacity: 1 },
            closed: { height: 0, opacity: 0 },
        };

        return (
            <tr className='align-middle' style={{ cursor: 'pointer' }} onMouseEnter={this.enterQuery.bind(this)} onMouseLeave={this.exitQuery.bind(this)}>
                <td align='left' style={{ verticalAlign: 'middle' }} onClick={c}>{this.props.info.name}</td>
                <td align='right'>
                    <motion.span
                        variants={variants}
                        initial={'closed'}
                        animate={this.state.hovered ? 'open' : 'closed'}
                        transition={{ duration: 0.1 }}
                    >
                        <GlyphiconSpan
                            tooltip
                            tooltipDir='bottom'
                            tooltipTitle='Copy Query'
                            style={{ padding: '1px 5px' }}
                            click={() => copyQuery()}
                        >
                            <span className={
                                this.context.darkMode
                                    ? 'btn btn-xs menu-button-dark'
                                    : 'btn btn-xs menu-button-light'
                            }>
                                <Icon glyph='copy' extraClass='menuglyph' />
                            </span>
                        </GlyphiconSpan>
                    </motion.span>
                </td>
            </tr >
        );
    }
}
//export default withAlert()(PrebuiltQueryNode)
