import React, { Component } from 'react';
import './styles/App.css';
import firebase from './firebase'
import axios from 'axios';
import Qs from 'qs';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import Login from "./Login";
import CreateAccount from './CreateAccount'
import Main from './Main'

const provider = new firebase.auth.GoogleAuthProvider();
const auth = firebase.auth();

const geocodeKey = "AIzaSyC7aX88PBTGc5vWZS5P6QTENMfde_Qz194";
const urlGeoCode = "https://maps.googleapis.com/maps/api/geocode/json?"


class App extends Component {
  constructor() {
    super()
    this.state = {
      user: null,
      coffee:[],
      bar:[],
      midPointCoordinates: {
        lat: null,
        lng: null
      }, 
      userLocation: "278 King St W.",
      secondLocation: "",
      userCoordinates: {},
      secondCoordinates: {},
      isGuest: false,
      newUser: true,
      toMain: false,
      toCreateAccount: false ,
      showingCoffee: true,
      showingBar: true
    }
  }
  componentDidMount() {
    auth.onAuthStateChanged((user) => {
      console.log('firing');
      if (user) {
        this.setState(
          {
            user: user,
            newUser: false
          },() => {
            this.dbRef = firebase.database().ref(`/${this.state.user.uid}`);
            }
        )
      }
    })
  }

  componentWillUnmount() {
    if(this.dbRef){
      this.dbRef.off();
    }
  }

  logIn = () => {
    auth.signInWithPopup(provider).then((result) => {

      this.setState({
        user: result.user
      });
      if (this.state.newUser){
        this.setState({
          toCreateAccount: true
        })
      } else {
        this.setState({
          toMain: true
        })
      }
    });
  };

  logOut = () => {
    auth.signOut().then(() => {
      this.setState({
        user: null
      })
    })
  }

  handleSubmit = e => {
    e.preventDefault();
    console.log("Handle submit works", this.state.userLocation)
    const userAddress = this.state.userLocation
    
    const dbRef = firebase.database().ref(`/${this.state.user.uid}`);
    dbRef.push(userAddress);

    this.setState ({
      userLocation: userAddress
    })
  }

  restaurantResults = (lat, lng) => {
    console.log(lat, lng)
    const urlYelp = "https://api.yelp.com/v3/businesses/search";
    const yelpKey =
      "Bearer xH8QyqRzL7E-yuvI5Cq167iWbxZB7jLOCCHukA-TNZoUtALNKXcmYF-0pgqwwUuDiqibPZ_bfIgpYLz0WWrG6SHARQnLEeudmtJ0pZo-PxRvqIaA5aq14eL-n74FXHYx";
    //API CALL FOR YELP DATA
    axios({
      method: "GET",
      url: "http://proxy.hackeryou.com",
      dataResponse: "json",
      paramsSerializer: function (params) {
        return Qs.stringify(params, { arrayFormat: "brackets" });
      },
      params: {
        reqUrl: urlYelp,
        params: {
          // location: "toronto",
          radius: 1000,
          categories: "coffee,bars",
          latitude: lat,
          longitude: lng
        },
        proxyHeaders: {
          Authorization: yelpKey
        },
        xmlToJSON: false
      }
    }).then(res => {
      console.log("I work", res)
      const shopInfo = res.data.businesses
      const coffeeArray = []
      const barArray = []
      shopInfo.forEach((business) => {
        business.categories.forEach((alias) => {
          if (alias.alias === "coffee" || alias.title === "Coffee & Tea") {
            coffeeArray.push(business)
          } else if (alias.alias === "bars" || alias.alias === "pubs") {
            barArray.push(business)
          }
        })
      })
      this.setState({
        coffee: coffeeArray,
        bar: barArray
      })
    });
  };
  

  setUserCoordinates = (coordinates) => {
    const newObject = {};
    newObject.lat = coordinates.lat;
    newObject.lng = coordinates.lng;
    console.log('new', newObject);
    this.setState({
      userCoordinates: newObject
    });
    console.log('state', this.state.userCoordinates);
  }

  setSecondCoordinates = (coordinates) => {
    const newObject = {};
    newObject.lat = coordinates.lat;
    newObject.lng = coordinates.lng;
    console.log('new', newObject);
    this.setState({
      secondCoordinates: newObject
    });
    this.midPoint();
  }

  //API CALL FOR GEOCODE DATA
  getCoordinates(addressInput, callback){
    axios({
      method: "GET",
      url: urlGeoCode,
      dataResponse: "json",
      params: {
        key: geocodeKey,
        address: addressInput
      }
    }).then(
      (response) => {
        console.log('res', response.data.results[0].geometry.location);
        const coordinates = response.data.results[0].geometry.location;
        callback(coordinates);
      })
  }

  handleChange = e => {
    this.setState({
      [e.target.id]: e.target.value
    })
  }

  handleClick = (e) => {
    e.preventDefault();
    this.getCoordinates(this.state.userLocation, this.setUserCoordinates);
    //The secondCoordinates are not changing here.
    this.getCoordinates(this.state.secondLocation, this.setSecondCoordinates);
  }
  midPoint = () => {
    const midY = (this.state.secondCoordinates.lat + this.state.userCoordinates.lat) / 2;
    const midX = (this.state.secondCoordinates.lng + this.state.userCoordinates.lng) / 2;
    const midObj = {};
    midObj.lat = midY
    midObj.lng = midX
    this.setState({
      midPointCoordinates: midObj
    });
    this.restaurantResults(this.state.midPointCoordinates.lat, this.state.midPointCoordinates.lng)
   
  }

  toggleCoffee = () => {
    this.setState({
      showingCoffee: !this.state.showingCoffee
    })
  }

  toggleBar = () => {
    this.setState({
      showingBar: !this.state.showingBar
    })
  }

  handleAddressChange = (e) => {
    if (e.target.value) {
      this.setState({
        [e.target.id]: e.target.value
      })
    }
  }


  render() {
    return (
      <Router>
        <div className="App">
        <Route 
          exact path="/"
          render={(props) => (
          <Login {...props} 
          user={this.state.user}
          logOut={this.logOut}
          logIn={this.logIn}
          userLocation={this.state.userLocation}
          handleSubmit={this.handleSubmit}
          handleChange={this.handleChange}
          toCreateAccount={this.toCreateAccount}
          toMain={this.state.toMain}
          />
        )}/>
        <Route 
          exact path="/CreateAccount" 
          render={(props) => (
          <CreateAccount {...props} 
          user={this.state.user}
          userLocation={this.state.userLocation}
          handleSubmit={this.handleSubmit}
          handleChange={this.handleChange}
          />
        )}/>
        <Route 
          exact path="/Main" 
          render={(props) => (
          <Main {...props} 
          user={this.state.user}
          userLocation={this.state.userLocation}
          handleSubmit={this.handleSubmit}
          handleChange={this.handleChange}
          userCoordinates={this.state.userCoordinates}
          secondCoordinates={this.state.secondCoordinates}
          midPoint={this.state.midPointCoordinates}
          bar={this.state.bar}
          coffee={this.state.coffee}
          showingCoffee={this.state.showingCoffee}
          showingBar={this.state.showingBar}
          toggleCoffee={this.toggleCoffee}
          toggleBar={this.toggleBar}
          handleAddressChange={this.handleAddressChange}
          handleClick={this.handleClick}
          midPointCoordinates={this.state.midPointCoordinates}
          />
        )}/>
        </div>
      </Router>
    );
  }
}

export default App;

