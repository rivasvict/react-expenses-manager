import React from 'react';
import AddEntry from './AddEntry';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';

let container = null;

const categoryOptions = [{ name: 'Cat1', value: 'cat1' }, { name: 'Cat2', value: 'cat2' }];
const entryData = {
  valid: { ammount: '12', category: categoryOptions[0].value, description: '', type: 'Income' },
  invalid: { ammount: 'as12', category: categoryOptions[0].value, description: '', type: 'Income' }
};

describe('Test AddEntry component', () => {
  let handleEntryMock = null;

  function renderAddEntryComponent (entryDataModel) {
    handleEntryMock = jest.fn();
    act(() => {
      render(<AddEntry.WrappedComponent 
        history={[]}
        entryModel={entryDataModel} categoryOptions={categoryOptions} handleEntry={handleEntryMock} />, container);
    });

    act(() => {
      const submitButton = container.querySelector('[name="submit"]');
      submitButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  }

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    unmountComponentAtNode(container);
    container.remove();
    container = null;
  });

  describe('handleSumbit test in valid data input', () => {
    let validDataModel = null;
    beforeEach(() => {
      validDataModel = entryData.valid;
      renderAddEntryComponent(validDataModel);
    });

    it('handleSubmit: should call handleEntry only once when user inputs valid data', () => {
      expect(handleEntryMock.mock.calls.length).toBe(1);
    });

    it('handleSubmit: should call handleEntry with correct parameters when usrer inputs valid data', () => {
      expect(handleEntryMock.mock.calls[0][0]).toStrictEqual(validDataModel);
    });
  })

  describe('handleSumbit test in valid data input', () => {
    let validDataModel = null;
    beforeEach(() => {
      validDataModel = entryData.invalid;
      renderAddEntryComponent(validDataModel);
    });

    it('handleSubmit: should never call handleEntry when user inputs invalid data', () => {
      expect(handleEntryMock.mock.calls.length).toBe(0);
    });
  })
});
