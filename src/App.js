import React, { Component } from 'react';
import './styles/App.css';
import firebase from './firebase'
import axios from 'axios';
import Qs from 'qs';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';
import Login from "./Login";
import CreateAccount from './CreateAccount'
import Main from './Main'
// import MapWithMarkerClusterer from './MyMapComponent'
import FindInvite from './FindInvite'



const provider = new firebase.auth.GoogleAuthProvider();
const auth = firebase.auth();

const geocodeKey = "AIzaSyC7aX88PBTGc5vWZS5P6QTENMfde_Qz194";
const urlGeoCode = "https://maps.googleapis.com/maps/api/geocode/json?";

class App extends Component {
  constructor() {
    super()
    this.state = {
      user: {},
      coffee:[],
      bar:[],
      markers:[],
      midPointCoordinates: {
        lat: null,
        lng: null
      }, 
      userLocation: "",
      userLocationForm: "",
      secondLocation: "",
      userCoordinates: {},
      secondCoordinates: {},
      isGuest: false,
      newUser: true,
      toMain: false,
      toCreateAccount: false ,
      showingCoffee: true,
      showingBar: true,
      userNameForm: "",
      userName: "",
      search: "",
      searchedUser: "",
      showDirections: false,
      searchedUID: "",
      secondLocationBelongsToUser: false,
      secondUserName: "",
      pendingMessages: 0,
      messages: [],
      newMessageContent: "",
      userMOT: "",
      secondMOT: "",
      item: {},
      messagesdisplayed: false,
      currentOpenConversation: "",
      inputsFilled: true,
      bothAreUsers: false,
      showMessage: false,
      dateSuggestion: {},
      inviteMarker: [],
      markerMidPoint: {},
      showFindInvite: false
    }
  }

  componentDidMount() {

    auth.onAuthStateChanged((user) => {
      //  ('firing');
      if (user) {
        this.setState(
          {
            user: user,
          },() => {
            this.dbRef = firebase.database().ref(`/users/${this.state.user.uid}`);
            this.dbRef.on('value', (snapshot) => {
              if (snapshot.val() !== null){
                this.setState({
                  userLocation: (snapshot.val().userAddress),
                  userName: (snapshot.val().userName),
                  // toMain: !this.state.showFindInvite ? true : false
                }, () => {
                  this.fetchMessages(); 
                })
              }
            })
          }
        )
      }
    })
    this.fetchMessages();
    //  (this.state.messages);
  }

  componentWillUnmount() {
    if(this.dbRef){
      this.dbRef.off();
    }
  }
  
  logIn = () => {
    auth.signInWithPopup(provider).then((result) => {
      
      const userObject = Object.assign({}, result.user);
      this.setState({
        user: userObject
      }
      );
      firebase.database().ref(`/users/${userObject.uid}`).once('value').then((snapshot) => {
        //  ("on login", snapshot.val());
        if(snapshot.exists()) {
          this.setState({
            newUser: false
          }, () => {
            this.redirectAfterLogin();
          }
          )
        } else {
          this.redirectAfterLogin();
        }
      });
    })
  }  

  redirectAfterLogin = () => {
    if (this.state.newUser) {
      this.setState({
        toCreateAccount: true
      })
    } else {
      this.setState({
        toMain: true
      })
    }
  }

  signInAsGuest = () => {
    auth.signInAnonymously();
  }

  logOut = () => {
    auth.signOut().then(() => {
      this.setState({
        user: null
      })
    })
  }

  handleSubmit = e => {
    e.preventDefault();
    //  ("Handle submit works", this.state.userLocation)
    const userInfo = {
      userName: this.state.userNameForm,
      userAddress: this.state.userLocationForm
    }
    const dbRef = firebase.database().ref(`/users/${this.state.user.uid}`);
    const dbRefUserList = firebase.database().ref(`/userNames/${this.state.userName}`);
    dbRef.set(userInfo);

    dbRef.once('value').then((snapshot) => {
      this.setState ({
        userLocation: (snapshot.val().userAddress),
        userName: (snapshot.val().userName),
        toMain:true
      }, () => {
        dbRefUserList.set(this.state.user.uid);
      })
    });
  }

  restaurantResults = (lat, lng) => {
    const urlYelp = "https://api.yelp.com/v3/businesses/search";
    const yelpKey =
      "Bearer xH8QyqRzL7E-yuvI5Cq167iWbxZB7jLOCCHukA-TNZoUtALNKXcmYF-0pgqwwUuDiqibPZ_bfIgpYLz0WWrG6SHARQnLEeudmtJ0pZo-PxRvqIaA5aq14eL-n74FXHYx";
    //API CALL FOR YELP DATA
    axios({
      method: "GET",
      url: "https://proxy.hackeryou.com",
      dataResponse: "json",
      paramsSerializer: function (params) {
        return Qs.stringify(params, { arrayFormat: "brackets" });
      },
      params: {
        reqUrl: urlYelp,
        params: {
          radius: 500,
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
      //  ("calling Yelp API & retrieving all restaurants:", res)
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


  recieveRestaurantResult = (restaurantName, restaurantCoordinates, restaurantPhone, restaurantImage, restaurantID) => {
    const marker = {
      coordinates: restaurantCoordinates,
      phone: restaurantPhone,
      id: restaurantID,
      image_url: restaurantImage,
      name: restaurantName
    };

    const invite = []
    invite.push(marker)
    
    this.setState({
      markerMidPoint: restaurantCoordinates,
      inviteMarker: invite,
      showFindInvite: true
    }, () => {
      this.setState({
        messagesdisplayed: false
      })
    })
  }
  

  showMessageBar = (name, phone, image, id, coordinates) => {
    const restaurant = {
      restaurantName: name,
      restaurantPhone: phone,
      restaurantImage: image,
      restaurantID: id,
      restaurantCoordinates: coordinates
    }
    this.setState({
      showMessage: !this.state.showMessage,
      dateSuggestion: restaurant
    })
  }
  
  pushCoffeeAndBarToMarker= ()=>{
    if(this.state.showingCoffee === true && this.state.showingBar === true){
      const coffee = this.state.coffee
      const bar = this.state.bar
      this.setState({
        markers: bar.concat(coffee)
      })
    } else if (this.state.showingCoffee === true && this.state.showingBar === false){
      const coffee = this.state.coffee
      this.setState({
        markers: coffee
      })
    } else if (this.state.showingBar === true && this.state.showingCoffee === false){
  
      const bar = this.state.bar
      this.setState({
        markers: bar
      })
    } else {
      this.setState({
        markers: []
      })
    }
  }

  setUserCoordinates = (coordinates) => {
    const newObject = {};
    newObject.lat = coordinates.lat;
    newObject.lng = coordinates.lng;
    this.setState({
      userCoordinates: newObject
    });
  }

  setSecondCoordinates = (coordinates) => {
    const newObject = {};
    newObject.lat = coordinates.lat;
    newObject.lng = coordinates.lng;
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
    // this.recieveRestaurantResult();
    if (this.state.userLocation !== "" && this.state.search !== "" && this.state.userMOT && this.state.secondMOT){
      this.setState({
        inputsFilled: true,

      })
      this.searchFirebase(this.state.search, "users", this.getCoordinatesRelatedToSearch);
    } else {
      this.setState({
        inputsFilled: false
      })
    }
  }
  showDirections=()=>{
    setTimeout(()=>{
        this.setState({
        showDirections: true,
      })}, 3000)

  }
    
  midPointBasedOnMOT = () => {
    //  ("Coordinates available to find midpoint", this.state.userCoordinates, this.state.secondCoordinates)
    if (this.state.userMOT === "driving" && this.state.secondMOT === "walking") {
      //driving-walking
      this.midY = (this.state.secondCoordinates.lat * 5 / 6) + (this.state.userCoordinates.lat / 6);
      this.midX = (this.state.secondCoordinates.lng * 5 / 6) + (this.state.userCoordinates.lng / 6);
    } else if (this.state.userMOT === "walking" && this.state.secondMOT === "driving") {
      //walking-driving
      this.midY = (this.state.secondCoordinates.lat / 6) + (this.state.userCoordinates.lat * 5 / 6);
      this.midX = (this.state.secondCoordinates.lng / 6) + (this.state.userCoordinates.lng * 5 / 6);
    } else if (this.state.userMOT === "driving" && this.state.secondMOT === "transit") {
      //driving-transit
      this.midY = (this.state.secondCoordinates.lat * 5 / 8) + (this.state.userCoordinates.lat * 3 / 8);
      this.midX = (this.state.secondCoordinates.lng * 5 / 8) + (this.state.userCoordinates.lng * 3 / 8);
    } else if (this.state.userMOT === "transit" && this.state.secondMOT === "driving") {
      //transit-driving
      this.midY = (this.state.secondCoordinates.lat * 3 / 8) + (this.state.userCoordinates.lat * 5 / 8);
      this.midX = (this.state.secondCoordinates.lng * 3 / 8) + (this.state.userCoordinates.lng * 5 / 8);
    } else if (this.state.userMOT === "driving" && this.state.secondMOT === "bicycling") {
      //driving-bicycling
      this.midY = (this.state.secondCoordinates.lat * 5 / 7) + (this.state.userCoordinates.lat * 2 / 7);
      this.midX = (this.state.secondCoordinates.lng * 5 / 7) + (this.state.userCoordinates.lng * 2 / 7);
    } else if (this.state.userMOT === "bicycling" && this.state.secondMOT === "driving") {
      //bicycling-driving
      this.midY = (this.state.secondCoordinates.lat * 2 / 7) + (this.state.userCoordinates.lat * 5 / 7);
      this.midX = (this.state.secondCoordinates.lng * 2 / 7) + (this.state.userCoordinates.lng * 5 / 7);
    } else if (this.state.userMOT === "walking" && this.state.secondMOT === "transit") {
      //walking-transit
      this.midY = (this.state.secondCoordinates.lat / 4) + (this.state.userCoordinates.lat * 3 / 4);
      this.midX = (this.state.secondCoordinates.lng / 4) + (this.state.userCoordinates.lng * 3 / 4);
    } else if (this.state.userMOT === "transit" && this.state.secondMOT === "walking") {
      //transit-walking
      this.midY = (this.state.secondCoordinates.lat * 3 / 4) + (this.state.userCoordinates.lat / 4);
      this.midX = (this.state.secondCoordinates.lng * 3 / 4) + (this.state.userCoordinates.lng / 4);
    } else if (this.state.userMOT === "walking" && this.state.secondMOT === "bicycling") {
      //walking-bicycling
      this.midY = (this.state.secondCoordinates.lat / 3) + (this.state.userCoordinates.lat * 2 / 3);
      this.midX = (this.state.secondCoordinates.lng / 3) + (this.state.userCoordinates.lng * 2 / 3);
    } else if (this.state.userMOT === "bicycling" && this.state.secondMOT === "walking") {
      //bicycling-walking
      this.midY = (this.state.secondCoordinates.lat * 2 / 3) + (this.state.userCoordinates.lat / 3);
      this.midX = (this.state.secondCoordinates.lng * 2 / 3) + (this.state.userCoordinates.lng / 3);
    } else if (this.state.userMOT === "bicycling" && this.state.secondMOT === "transit") {
      //bicycling-transit
      this.midY = (this.state.secondCoordinates.lat * 2 / 5) + (this.state.userCoordinates.lat * 3 / 5);
      this.midX = (this.state.secondCoordinates.lng * 2 / 5) + (this.state.userCoordinates.lng * 3 / 5);
    } else if (this.state.userMOT === "transit" && this.state.secondMOT === "bicycling") {
      //transit-bicycling
      this.midY = (this.state.secondCoordinates.lat * 3 / 5) + (this.state.userCoordinates.lat * 2 / 5);
      this.midX = (this.state.secondCoordinates.lng * 3 / 5) + (this.state.userCoordinates.lng * 2 / 5);
    } else {
      //driving-driving bicycling-bicycling walking-walking transit-transit OR just no MOT specified
      this.midY = ((this.state.secondCoordinates.lat + this.state.userCoordinates.lat) / 2);
      this.midX = ((this.state.secondCoordinates.lng + this.state.userCoordinates.lng) / 2);
    }
    //  ("Getting midpoints based on MOT:", this.midX, this.midY)
  }

  midPoint = () => {
    this.midPointBasedOnMOT();
    const midObj = {};
    midObj.lat = this.midY
    midObj.lng = this.midX
    this.setState({
      midPointCoordinates: midObj,
      // searchedUID: "",
      secondLocationBelongsToUser: false
    });
    this.restaurantResults(this.state.midPointCoordinates.lat, this.state.midPointCoordinates.lng)
    setTimeout(this.pushCoffeeAndBarToMarker, 1000);
  }

  handleAddressChange = (e) => {
    this.setState({
      [e.target.id]: e.target.value
    })
  }


  searchFirebase = (search, node, callback) => {
    //  ('searchingFB');
    const dbRefName = firebase.database().ref(`/users/`);
    //  (dbRefName);
    dbRefName.once('value').then((snapshot) => {
      const newArrayOfArrays = Object.entries(snapshot.val())
      //  ('aofa', newArrayOfArrays);
      //  (snapshot.val());
      newArrayOfArrays.forEach((array) => {
        //  (array[1].userName)
        //  (search)
        //  (array)
        if (search === array[1].userName) {
          this.setState({
            searchedUID: array[0]
          }, () => {
            callback(search, node)
          });
        } else if (node === "users"){
          callback(search, node)
          //IF THERE IS TIME TRY TO FIND A WAY TO MAKE THIS ONLY RUN AFTER THE SEARCH RUNS THROUGH EACH ITTERATION
        }
      })
    })
  }  



  getCoordinatesRelatedToSearch = (search, node) => {
    //  ('node2',node);
    
    this.setState({
      secondLocationBelongsToUser: false,
      // searchedUID: ""
    });
    const dbRefNode = firebase.database().ref(`/${node}/`);
    dbRefNode.once('value').then((snapshot) => {  
      //  (snapshot);
      const newArrayOfArrays = Object.entries(snapshot.val());
      newArrayOfArrays.forEach((item) => {
        
        if (this.state.searchedUID === item[0]) {
          this.setState({
            secondLocationBelongsToUser: true,
            item:item
          });
        }
      })
      if (this.state.secondLocationBelongsToUser){
        this.searchForCoordinates(this.state.search, this.state.item)
      } else {
        this.searchForCoordinates(this.state.search)
      }
    })  
    this.setState({
      // searchedUID: ""
    })
  }

  fetchMessages = () => {
    //  ('fetching');
    const dbRef = firebase.database().ref(`/messages/${this.state.user.uid}/`);
    dbRef.once('value').then((snapshot) => {
      if (snapshot.val() === null){
        return
      }
      //  ('snapshot', snapshot.val());
      const newArray = [];
      Object.entries(snapshot.val()).forEach((entry) => {
        //  (entry);
        const newObject = entry[1];
        newObject.key = entry[0];
        newArray.push(newObject);
        
        //  ('not in state', newArray)
      });
      this.setState({
        messages: newArray
      }, () => {
        this.sortMessages();
      });
    });
  }

  sortMessages = () => {
    this.state.messages.sort((a, b) => {
      //  ('a',a,'b',b);
      return a.currentDate - b.currentDate;
    })
    //  (newMessagesArray);
  }

  handleClickDisplayMessages = () => {
    if (this.state.messagesdisplayed) {
      this.setState({
        messagesdisplayed: false
      });
    } else {
      this.setState({
        messagesdisplayed: true
      });
    }
  }


  
  searchForCoordinates = (search, user) => {
    this.getCoordinates(this.state.userLocation, this.setUserCoordinates);
    if(user){
      this.setState({
        secondLocation: user[1].userAddress,
        secondUserName: user[1].userName,
        bothAreUsers: (this.state.userName ? true : false)
        // secondLocationBelongsToUser: true
      }, () => {
        //  ('setting second location', this.state.secondLocation);
        //  ("is a user: getting coordinates");
        this.getCoordinates(this.state.secondLocation, this.setSecondCoordinates);
        // this.searchForOpenConversations();
      });
      } else {
      //  ('not a user: getting coordinates')
      this.setState({
        secondLocation: search,
        searchedUID: "",
        currentOpenConversation: ""
      }, () => {
        this.getCoordinates(this.state.secondLocation, this.setSecondCoordinates);
      })
    }
    this.setState({
      item: {},
      search: ""
    })
  }

  searchForOpenConversations = () => {
    const dbRefConversations = firebase.database().ref(`/users/${this.state.user.uid}/openConversations/`);
    dbRefConversations.once('value').then((snapshot) => {
      Object.entries(snapshot.val()).forEach((conversation) => {
        if (Object.keys(conversation[1])[0] === this.state.searchedUID){
          this.setState({
            currentOpenConversation: conversation[1][this.state.searchedUID]
          }, () => {
            this.setState({
              searchedUID: ""
            })
          })
        }
        // return conversation[1][this.state.searchedUID]
      })
    });
  }

  handleSendMessage = (e) => {
    e.preventDefault();

    this.searchFirebase(this.state.secondUserName, `messages`, this.deliverNewMessage);
  }

  deliverNewMessage = (receiver, node) => {
    const dbRefNode = firebase.database().ref(`/${node}/${this.state.searchedUID}/`)
    const conversation = {
      from: this.state.userName,
      sendingUID: this.state.user.uid,
      message: [
        [this.state.newMessageContent, new Date().toDateString(), this.state.userName]
      ],
      restaurantSuggestion: this.state.dateSuggestion,
      displayDate: new Date().toDateString(),
      currentDate: Date()
      //should also add yelp ID
    }
    if(!this.state.currentOpenConversation){
      this.createFirstConversation(dbRefNode, conversation)
  
    } else {
      this.addToExistingConversation(conversation)
    }
    // dbRefNode.val();
  }

  createFirstConversation = (dbRefNode, conversation) => {
    const dbRefConversations = firebase.database().ref(`/users/${this.state.user.uid}/openConversations`)
    dbRefNode.push(conversation);
    dbRefNode.once('value').then((snapshot) => {
      const newArray = Object.keys(snapshot.val());
      //  (newArray[0]);
      const newConversation = {[this.state.searchedUID]: newArray[0]}
      dbRefConversations.push(newConversation)
      this.setState({
        currentOpenConversation: newArray[0]
      }, () => {
        this.addConversationToUserInbox();
        
        // this.createOpenConversationInSecondUserAccount(savedID);
      })
    })
  }

  addToExistingConversation = (conversation) => {
    const dbRefOpenConversation = firebase.database().ref(`/messages/${this.state.searchedUID}/${this.state.currentOpenConversation}/message/`);
    dbRefOpenConversation.once('value').then((snapshot) => {
      const newArray = snapshot.val();
      newArray.push(conversation.message[0]);
      dbRefOpenConversation.set(newArray);
      this.addConversationToUserInbox();
    })
  }
  toggleCoffee = () => {
    this.setState({
      showingCoffee: !this.state.showingCoffee
    }, () => {
      this.pushCoffeeAndBarToMarker()
    })
  }

  toggleBar = () => {
    this.setState({
      showingBar: !this.state.showingBar
    }, () => {
      this.pushCoffeeAndBarToMarker()
    })
  }

  addConversationToUserInbox = () => {
    const savedID = this.state.searchedUID;
    const savedName = this.state.secondUserName;
    const currentconvo = this.state.currentOpenConversation;
    const dbRefOpenConversation = firebase.database().ref(`/messages/${this.state.searchedUID}/${this.state.currentOpenConversation}/`);
    const dbRefUserConversation = firebase.database().ref(`/messages/${this.state.user.uid}/${this.state.currentOpenConversation}/`);
    const dbRefSecondUser = firebase.database().ref(`/users/${savedID}/openConversations/`);
    dbRefOpenConversation.once('value').then((snapshot) => {

      const newObject = snapshot.val();
      newObject.from = savedName;
      newObject.sendingUID = this.state.searchedUID;

      dbRefUserConversation.set(newObject);
    });
  }

  createOpenConversationInSecondUserAccount = (savedID) => {
    const dbRefSecondUser = firebase.database().ref(`/users/${savedID}/openConversations/`)
    const newConversation = { [this.state.searchedUID]: this.state.currentOpenConversation }
    dbRefSecondUser.push(newConversation)
  }

  handleMOTChange = e => {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  replyToMessage = (replyToName, replyToUID, message) => {
    this.setState({
      searchedUID: replyToUID,
      newMessageContent: message
    }, () => {
      this.deliverNewMessage(replyToName, 'messages')
    });
  }

  selectMessageForReply = (currentOpenConversation) => {
    this.setState({
      currentOpenConversation: currentOpenConversation
    })
  }

  fillTheInputs = () => {
    this.setState({
      inputsFilled: true
    })
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
          toCreateAccount={this.state.toCreateAccount}
          toMain={this.state.toMain}
          signInAsGuest={this.signInAsGuest}
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
          userName={this.state.userName}
          />
        )}/>
        <Route 
          exact path="/Main" 
          render={(props) => (
          <Main {...props} 
          user={this.state.user}
          userLocation={this.state.userLocation}
          onSubmit={this.handleSubmit}
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
          toMain={this.state.toMain}


          markers={this.state.markers}

          userCoordinatesLat = {
            this.state.userCoordinates.lat
          }
          userCoordinatesLng = {
            this.state.userCoordinates.lng
          }
          secondLocationBelongsToUser={this.state.secondLocationBelongsToUser}
          newMessageContent={this.state.newMessageContent}
          handleSendMessage={this.handleSendMessage}
          handleMOTChange={this.handleMOTChange}
          messages={this.state.messages}
          handleClickDisplayMessages={this.handleClickDisplayMessages}
          messagesdisplayed={this.state.messagesdisplayed}
          replyToMessage={this.replyToMessage}
          inputsFilled={this.state.inputsFilled}
          bothAreUsers={this.state.bothAreUsers}
          recieveRestaurantResult={this.recieveRestaurantResult}
          showMessageBar={this.showMessageBar}
          showMessage={this.state.showMessage}
          dateSuggestion={this.state.dateSuggestion}
          suggestDate={this.suggestDate}
          userMOT={this.state.userMOT}
          selectMessageForReply={this.selectMessageForReply}
          logOut={this.logOut}
          secondMOT={this.state.secondMOT}
          fillTheInputs={this.fillTheInputs}
          userName={this.state.userName}
          showFindInvite={this.state.showFindInvite}
          />
          
        )}/>

        <Route 
          exact path="/FindInvite" 
          render={(props) => (
          <FindInvite {...props} 
          user={this.state.user}
          userLocation={this.state.userLocation}
          onSubmit={this.handleSubmit}
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
          markers={this.state.markers}
          userCoordinatesLat = {this.state.userCoordinates.lat}
          userCoordinatesLng = {this.state.userCoordinates.lng}
          secondLocationBelongsToUser={this.state.secondLocationBelongsToUser}
          newMessageContent={this.state.newMessageContent}
          handleSendMessage={this.handleSendMessage}
          handleMOTChange={this.handleMOTChange}
          messages={this.state.messages}
          handleClickDisplayMessages={this.handleClickDisplayMessages}
          messagesdisplayed={this.state.messagesdisplayed}
          replyToMessage={this.replyToMessage}
          inputsFilled={this.state.inputsFilled}
          bothAreUsers={this.state.bothAreUsers}
          recieveRestaurantResult={this.recieveRestaurantResult}
          showMessageBar={this.showMessageBar}
          showMessage={this.state.showMessage}
          dateSuggestion={this.state.dateSuggestion}
          suggestDate={this.suggestDate}
          userMOT={this.state.userMOT}
          logOut={this.logOut}
          getCoordinates={this.getCoordinates}
          setUserCoordinates={this.setUserCoordinates}
          inviteMarker={this.state.inviteMarker}
          markerMidPoint={this.state.markerMidPoint}
          />
        )}/>
        </div>
      </Router>
    );
  }
}

export default App;

