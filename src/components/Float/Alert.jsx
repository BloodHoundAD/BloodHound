import React, { useState } from "react";
import { Alert } from "react-bootstrap";

export default function GenericAlert() {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("No data returned from query");
  const [timer, setTimer] = useState(null);

  const handleDismiss = () => {
    setVisible(false);
  };

  const handleShow = text => {
    clearTimeout(timer);

    const time = setTimeout(() => {
      handleDismiss();
    }, 2500);

    setVisible(true);
    setText(text);
    setTimer(time);
  };

  emitter.on("showAlert", msg => handleShow(msg));
  emitter.on("hideAlert", () => handleDismiss());

  return (
    visible && (
      <Alert className="alertdiv" bsStyle="info" onDismiss={handleDismiss}>
        {text}
      </Alert>
    )
  );
}
