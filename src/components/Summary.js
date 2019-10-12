import React, { Component } from 'react';
import {gerNegativeVersionOfEntries} from '../helpers/entriesHelper';
import EntriesSummary from './EntriesSummary';

class Summary extends Component {
    constructor(props) {
        super();
        this.state = { filter: '' }
    }

    handleChange = event => {
        const { value } = event.currentTarget;
        this.setState(state => {
            return { filter: value }
        });
    }

    getFilteredEntries = filter => {
        const entriesSummary = {
            incomes: <EntriesSummary entries={this.props.entries['incomes']} name='Incomes' />,
            outcomes: <EntriesSummary entries={this.props.entries['outcomes']} name='Outcomes' />
        }
        const outcomes = gerNegativeVersionOfEntries(this.props.entries.outcomes);

        return entriesSummary[filter] || <EntriesSummary entries={[...this.props.entries.incomes, ...outcomes]} name='Summary' />
    }

    render() {
        return (
            <div>
                <form>
                    <select name='filter' value={this.state.filter} onChange={this.handleChange}>
                        <option value=''>All incomes and outcomes</option>
                        <option value='incomes'>Incomes</option>
                        <option value='outcomes'>Outcomes</option>
                    </select>
                </form>
                {this.getFilteredEntries(this.state.filter)}
            </div>
        )
    }
}

export default Summary;