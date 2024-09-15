import { useRef } from "react";
import { Button, Form } from "react-bootstrap";

const FileButton = ({ onClick: handleFileSelection, children, ...props }) => {
  const fileRef = useRef(null);

  const openFileDialog = () => {
    fileRef?.current?.click();
  };

  return (
    <>
      <Form.Control
        type="file"
        variant="secondary"
        onChange={handleFileSelection}
        className="file"
        ref={fileRef}
      />
      <Button
        type="submit"
        variant="secondary"
        onClick={openFileDialog}
        {...props}
      >
        {children}
      </Button>
    </>
  );
};

export default FileButton;
