import React from "react";
import { MainContentContainer } from "../../MainContentContainer";
import { Bucket } from "./components/index.ts";
import "./styles.scss";
import ContentTileSection from "../../ContentTitleSection.js";
import { Col, Row, Button } from "react-bootstrap";
import ScreenTitle from "../../ScreenTitle.js";

const Buckets = (/*{ selectedDate, summarizedMonthEntries }*/) => {
  return (
    // @ts-expect-error temporarily ignore this typescript error
    <MainContentContainer
      className="buckets-container"
      pageTitle="Monthly Buckets"
    >
      <ContentTileSection title="Summary">
        September 2024 allocation: $3200.00
      </ContentTileSection>
      <Row className="month-header">
        <Col xs={3}>
          {true ? <Button onClick={() => {}}>Prev</Button> : null}
        </Col>
        <Col xs={6}>
          <ScreenTitle
            // screenTitle={`${getMonthNameDisplay(selectedDate.month)} ${selectedDate.year}`}
            screenTitle={`September`}
          />
        </Col>
        <Col xs={3}>
          {true ? <Button onClick={() => {}}>Next</Button> : null}
        </Col>
      </Row>
      <Bucket category="Food" limitAmount={1000} currentValue={400} />
      <Bucket category="Clothing" limitAmount={200} currentValue={100} />
      <Bucket category="Electricity" limitAmount={1000} currentValue={998} />
      <Bucket category="Internet" limitAmount={1000} currentValue={759} />
    </MainContentContainer>
  );
};

export default Buckets;
