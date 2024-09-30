import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { MainContentContainer } from "../../MainContentContainer";
import { useParams } from "react-router-dom/cjs/react-router-dom";
import { getBucket } from "../../../../redux/expensesManager/actionCreators";

const EditBucket = ({ getBucket }) => {
  const params = useParams();
  const { bucketName } = params;
  const [bucket, setBucket] = useState(null);
  useEffect(() => {
    (async () => {
      const bucket = await getBucket({ bucketName });
      console.log(bucket);
    })();
  }, []);
  return (
    <MainContentContainer className="edit-bucket" pageTitle="Edit bucket">
      Yooooo
    </MainContentContainer>
  );
};

const mapStateToProps = (state) => ({});

const mapActionsToProps = (dispatch) => ({
  getBucket: ({ bucketName }) => dispatch(getBucket({ bucketName })),
});

export default connect(
  mapActionsToProps,
  mapActionsToProps
)(withRouter(EditBucket));
