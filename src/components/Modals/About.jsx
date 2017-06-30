import React, {Component} from 'react';

var Modal = require('react-bootstrap').Modal;
var path = require('path')
var fs = require('fs')
const { app, shell } = require('electron').remote


export default class componentName extends Component {
    constructor(){
        super();

        var json = JSON.parse(fs.readFileSync(path.join(app.getAppPath(),'package.json')));

        fs.readFile(path.join(app.getAppPath(),'LICENSE.md'), 'utf8', function(err, data){
            this.setState({
                license: data
            })
        }.bind(this));

        this.state = {
            open: false,
            version: json.version
        }
    }

    closeModal(){
        this.setState({ open: false })
    }

    openModal(){
        this.setState({open: true})
    }

    componentDidMount() {
        emitter.on('showAbout', this.openModal.bind(this))        
    }

    render() {
        return (
            <Modal
                show={this.state.open}
                onHide={this.closeModal.bind(this)}
                aria-labelledby="AboutHeader">

                <Modal.Header closeButton={true}>
                    <Modal.Title id="AboutHeader">About BloodHound</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <h5><b>Version:</b> {this.state.version}</h5>
                    <h5><b>Github:</b> <a href="#" onClick={function(){shell.openExternal("https://www.github.com/BloodHoundAD/BloodHound")}}>https://www.github.com/adaptivethreat/BloodHound</a></h5>
                    <h5><b>Authors:</b> <a href="#" onClick={function(){shell.openExternal("https://www.twitter.com/harmj0y")}}>@harmj0y</a>, <a href="#" onClick={function(){shell.openExternal("https://www.twitter.com/_wald0")}}>@_wald0</a>, <a href="#" onClick={function(){shell.openExternal("https://www.twitter.com/cptjesus")}}>@cptjesus</a></h5>
                    <br />
                    <h5><b>License</b></h5>
                    <div className="aboutscroll">{this.state.license}</div>
                </Modal.Body>

                <Modal.Footer>
                    <button type="button" className="btn btn-primary" onClick={this.closeModal.bind(this)}>
                        Close
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }
}