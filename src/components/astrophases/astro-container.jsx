import React, { Component } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

import makeCancelable from '../../lib/cancelablePromise';

function createOffset(date) {
  const sign = (date.getTimezoneOffset() > 0) ? '-' : '+';
  const offset = Math.abs(date.getTimezoneOffset());
  const hours = Math.floor(offset / 60);
  return `${sign}${hours}`;
}

const thisDate = () => {
  const tmpDate = {
    newDate: new Date(),
  };
  tmpDate.mmddyyy = format(tmpDate.newDate, 'MM/DD/YYYY');
  tmpDate.tzOffset = createOffset(tmpDate.newDate);
  return tmpDate;
};

class Astrophases extends Component {
  constructor(props) {
    super(props);
    this.state = {
      astrophases: {},
      currentLocation: {
        lat: 0,
        lon: 0,
      },
      tDate: thisDate(),
    };
    this.updateAstrophases = this.updateAstrophases.bind(this);
  }

  componentDidMount() {
    if (navigator && navigator.geolocation) {
      this.geoPromise = makeCancelable(new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      }));
      this.geoPromise.promise.then((pos) => {
        const coords = pos.coords;
        this.setState({
          currentLocation: {
            lat: coords.latitude,
            lon: coords.longitude,
          },
        });
      })
      .catch(e => e);
    }
    this.getAstrophases();
  }

  getAstrophases = () => {
    console.log('getAstrophases called');
    const { currentLocation, tDate } = this.state;
    axios.get(`http://api.usno.navy.mil/rstt/oneday?date=${tDate.mmddyyy}&coords=${currentLocation.lat}N,${currentLocation.lon}E&tzOffset=${tDate.tzOffset}`)
      .then((response) => {
        if (response.status === 200) {
          return response.data;
        }
        throw new Error('Server fetch failed');
      })
      .then((responseData) => {
        this.setState({ astrophases: responseData });
      }).catch((error) => {
        this.setState({ astrophases: { error: 'true', fullError: error } });
      });
  }

  updateAstrophases() {
    this.getAstrophases();
  }

  render() {
    const { astrophases } = this.state;

    // something went wrong, no weatherforcast returned.
    if (!astrophases.dayofweek) {
      return (
        <div>
          Loading...<br />
          <button onClick={this.updateAstrophases}>Update</button>
        </div>
      );
    }

    if (astrophases.error === 'true') {
      return <div>Failed to load Astrophases</div>;
    }

    return (
      <div>
        <div>
          Day {astrophases.dayofweek}<br />
          Date {`${astrophases.month}/${astrophases.day}/${astrophases.year}`}<br />
          Sun Data:<br />
          <ul>
            {astrophases.sundata.map(aSun => (
              <li key={aSun.time}>
                <p>
                  phen {aSun.phen} {' - '} time {aSun.time}
                </p>
              </li>
            ))}
          </ul>
          Moon is {astrophases.curphase}<br />
          <ul>
            {astrophases.moondata.map(aMoon => (
              <li key={aMoon.time}>
                <p>
                  phen {aMoon.phen} {' - '} time {aMoon.time}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}

export default Astrophases;
