import React, { useState } from "react";
import { Alert } from "react-bootstrap";

export default function GenericAlert() {
  const DEFAULT_TEXT = "No data returned from query";
  const DEFAULT_TYPE = "danger";
  const DEFAULT_TIMEOUT = 2500;

  const [visible, setVisible] = useState(false);
  const [text, setText] = useState(DEFAULT_TEXT);
  const [type, setType] = useState(DEFAULT_TYPE);
  const [timer, setTimer] = useState(null);

  const handleDismiss = () => {
    setVisible(false);
  };

  const handleShow = ({
    text = DEFAULT_TEXT,
    timeout = DEFAULT_TIMEOUT,
    type = DEFAULT_TYPE
  }) => {
    clearTimeout(timer);

    const time = setTimeout(() => {
      handleDismiss();
    }, timeout);

    setVisible(true);
    setText(text);
    setType(type);
    setTimer(time);
  };

  emitter.on("showAlert", props => handleShow(props));
  emitter.on("hideAlert", () => handleDismiss());

  return (
    visible && (
      <Alert className="alertdiv" bsStyle={type} onDismiss={handleDismiss}>
        {text}
      </Alert>
    )
  );
}
