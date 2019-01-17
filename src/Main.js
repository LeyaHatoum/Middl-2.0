import { Link, Redirect } from 'react-router-dom';
import React, { Component} from 'react';
import MapWithMarkerClusterer from './MyMapComponent';
import Messages from './messages';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoffee, faBicycle, faBus, faWalking, faWineGlassAlt, faCar, faEnvelope   } from '@fortawesome/free-solid-svg-icons';


class Main extends Component {
    constructor() {
        super();
        this.state={
            markerMidPoint: {
            },
            runDirections:false,
            travelMode:"",
            distance:"",
            duration:"",
        }
    }
    //function that sets markerMidPoint
    getMarkerMidPoint = (marker)=>{
        const midLatLng = {};
        const latString = marker.latLng.lat()
        const lngString = marker.latLng.lng()
        midLatLng.lat= parseFloat(latString);
        midLatLng.lng= parseFloat(lngString);
        this.setState({
            markerMidPoint:midLatLng,
        }, ()=>{
            this.getSelectedInfo()
        })

    }
    getInfoFromDirections=(results)=>{
        const travelMode = results.request.travelMode;
        const distance = results.routes[0].legs[0].distance.text;
        const duration = results.routes[0].legs[0].duration.text;
        this.setState({
            travelMode,
            distance,
            duration
        })
    }
    getDirections=(e)=>{
        e.preventDefault();
        this.setState({
            runDirections:true
        })
    }
    getSelectedInfo=()=>{
        const array=this.props.markers;
            const resultArray = array.filter(latLng => {
                const long= Math.floor(latLng.coordinates.longitude.toFixed(5) * 10000);
                const lat = Math.floor(latLng.coordinates.latitude.toFixed(5) * 10000);
                const midLat = Math.floor(this.state.markerMidPoint.lat.toFixed(5) * 10000);
                const midLng = Math.floor(this.state.markerMidPoint.lng.toFixed(5) * 10000)
                    return (lat == midLat && long == midLng)
        }) 
            return(<div className="main__displayResults wrapper" key={`div-${resultArray[0].alias}`}>
                <p className="main__displayResults--title">{resultArray[0].name}</p>
                <p className="main__displayResults--number">{resultArray[0].display_phone}</p>
                <div className={this.state.travelMode ? null: "visuallyhidden"}>
                    <p className="main__resultDirections">{`From your location, your destination is ${this.state.distance} away. Based on your mode of transportation: ${this.state.travelMode} it will take you ${this.state.duration} to arrive.`}</p>
                </div>
                <img className="main__displayResults--picture" src={resultArray[0].image_url} alt=""/>
                <div className="main__displayResultsDirectionsButton">
                    <button
                    className="app__button"
                    onClick= {
                        this.getDirections
                    } > Need Directions ? </button>
                </div>
                {this.props.bothAreUsers ? 
                    (<div>
                    <button 
                    className="app__button"
                    onClick={() =>{this.props.showMessageBar(
                        resultArray[0].name,
                        resultArray[0].display_phone,
                        resultArray[0].image_url,
                        resultArray[0].id,
                        resultArray[0].coordinates
                    )}}>Share with your date</button>
                    {this.props.showMessage ? 
                        <form onSubmit={this.props.handleSendMessage}>
                            <input className="app__input" onChange={this.props.handleChange} type="text" id="newMessageContent"  />
                            <button
                            className="main__displayResultsButton app__button">Send Message</button>
                        </form>
                    : ""}
                </div>) : ""}
            </div>
        )
    }


    render() {
        return (
            <div className="main" key="main">
                {/* <button className="main__messagesButton" onClick={this.props.handleClickDisplayMessages}><FontAwesomeIcon className="app__font-awesome" icon={faEnvelope} /></button> */}
                    {this.props.messagesdisplayed 
                    ? (
                    <Messages className="messages"
                    messages={this.props.messages}
                    replyToMessage={this.props.replyToMessage}
                    recieveRestaurantResult={this.props.recieveRestaurantResult}
                    selectMessageForReply={this.props.selectMessageForReply}
                    userName={this.props.userName}
                    showFindInvite={this.props.showFindInvite}
                    />   
                    ) : ""
                    }
            
                <header className="header">

                    <h2 className="header__subTitle">Middl.</h2> 
                </header>

                <div className="main wrapper">
                    <h3 key="main-h2" className="main__h3">Please provide the following information</h3>
                    <form key="main-form" className="mainForm" >

                        {/* User form section */}
                        <div className="mainForm__individualContainer">
                        <h4 className = "mainForm--title">You</h4>
                            <label className ="mainForm--addressContainer"
                            htmlFor=""> 
                                <p className="mainForm__address">Please enter your destination (registered users will have their address loaded automatically) </p>
                                <input type="text" className="mainForm__input" placeholder="" value={this.props.userLocation} id="userLocation" onChange={this.props.handleChange} />
                            </label>
                            <div className="mainForm--addressContainer">
                                <p className="mainForm__mot">Your Mode of Transportation</p>
                                <div className="mainForm__inputLabel--displayFlex">
                                    <div className="mainForm__inputLabel--column">
                                        <label className={`app__radioLabel ${(this.props.userMOT === "walking") ? "activeLabel" : ""}`} htmlFor="walkUser"><FontAwesomeIcon className="app__font-awesome" icon={faWalking} /></label>
                                        <input className="activeInput visuallyhidden" name="userMOT" type="radio" value="walking" id="walkUser" onChange={this.props.handleMOTChange}/>
                                    </div>

                                    <div className="mainForm__inputLabel--column">
                                        <label className={`app__radioLabel ${(this.props.userMOT === "bicycling") ? "activeLabel" : ""}`} htmlFor="bikeUser"> <FontAwesomeIcon className="app__font-awesome" icon={faBicycle} /></label>
                                        <input className="activeInput visuallyhidden" name="userMOT" type="radio" value="bicycling" id="bikeUser" onChange={this.props.handleMOTChange}/>
                                    </div>
                                    
                                    <div className="mainForm__inputLabel--column">

                                        <label className={`app__radioLabel ${(this.props.userMOT === "driving") ? "activeLabel" : ""}`} htmlFor="carUser"><FontAwesomeIcon className="app__font-awesome" icon={faCar} /></label>
                                        <input className="activeInput visuallyhidden" name="userMOT" type="radio" value="driving" id="carUser" onChange={this.props.handleMOTChange}/>
                                        <input name="userMOT" type="radio" value="driving" id="carUser" onChange={this.props.handleMOTChange}/>

                                    </div>
                                    <div className="mainForm__inputLabel--column">
                                        <label className={`app__radioLabel ${(this.props.userMOT === "transit") ? "activeLabel" : ""}`} htmlFor="publicUser"><FontAwesomeIcon className="app__font-awesome" icon={faBus} /></label>
                                        <input className="activeInput visuallyhidden" name="userMOT" type="radio" value="transit" id="publicUser" onChange={this.props.handleMOTChange}/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Date form section */}
                        <div className="mainForm__individualContainer">
                            <h4 className="mainForm--title">Your Date</h4>
                            <label className ="mainForm--addressContainer" htmlFor="">
                                <p className="mainForm__address">Enter your date's address or username</p>
                                <input type="text" className="mainForm__input" placeholder="ex.123 Queen St. West" val={this.props.secondLocation}  onChange={this.props.handleAddressChange} id="search" />
                            </label>
                            <div className="mainForm--addressContainer">
                                <p className="mainForm__mot">Mode of Transportation</p>
                                <div className="mainForm__inputLabel--displayFlex">
                                    <div className="mainForm__inputLabel--column">
                                        
                                        <label className={`app__radioLabel ${(this.props.secondMOT) === "walking" ? "activeLabel" : ""}`} htmlFor="walkSecond"><FontAwesomeIcon className="app__font-awesome" icon={faWalking} /></label>
                                        <input className="activeInput visuallyhidden" name="secondMOT" type="radio" value="walking" id="walkSecond" onChange={this.props.handleMOTChange}/>
                                    </div>

                                    <div className="mainForm__inputLabel--column">
                                        <label className={`app__radioLabel ${(this.props.secondMOT === "bicycling") ? "activeLabel" : ""}`} htmlFor="bikeSecond"> <FontAwesomeIcon className="app__font-awesome" icon={faBicycle} /></label>
                                        <input className="activeInput visuallyhidden" name="secondMOT" type="radio" value="bicycling" id="bikeSecond" onChange={this.props.handleMOTChange}/>
                                    </div>
                                    
                                    <div className="mainForm__inputLabel--column">
                                        <label className={`app__radioLabel ${(this.props.secondMOT === "driving") ? "activeLabel" : ""}`} htmlFor="carSecond"><FontAwesomeIcon className="app__font-awesome" icon={faCar} /></label>
                                        <input className="activeInput visuallyhidden" name="secondMOT" type="radio" value="driving" id="carSecond" onChange={this.props.handleMOTChange}/>
                                    </div>
                                    
                                    <div className="mainForm__inputLabel--column">
                                        <label className={`app__radioLabel ${(this.props.secondMOT === "transit") ? "activeLabel" : ""}`} htmlFor="publicSecond"><FontAwesomeIcon className="app__font-awesome" icon={faBus} /></label>
                                        <input className="activeInput visuallyhidden" name="secondMOT" type="radio" value="transit" id="publicSecond" onChange={this.props.handleMOTChange}/>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </form>

                        {this.props.inputsFilled ? null : <button className="mainForm__errorMessage" onClick={this.props.fillTheInputs} ><p>Please fill in all input fields</p><p className="mainForm__errorMessageHint" >click on the box to return</p></button>}
                        
                        <button onClick={this.props.handleClick} 
                            
                        className="app__button">Middl. Me</button>

                    <div className="main__map">
                        <div className="main__map--container">
                        
                            <div className="main__mapPadding">
                                <div className={this.state.markerMidPoint.lat ? " visuallyhidden main__button--displayFlex" : "main__button--displayFlex"}>
                                    <div className="main__map--filterButtons">
                                        <button className="main__button" key="main-button1" onClick={this.props.toggleCoffee} value={this.props.showingCoffee}>
                                        {this.props.showingCoffee ?  
                                            <FontAwesomeIcon className="main__fontAwesome" icon={faCoffee} /> : 
                                            <FontAwesomeIcon className="main__fontAwesome--notShowing" icon={faCoffee} />
                                        }
                                        </button>
                                        <button key="main-button2" className="main__button" onClick={this.props.toggleBar}>{this.props.showingBar ? 
                                            <FontAwesomeIcon className="main__fontAwesome" icon={faWineGlassAlt} /> :   <FontAwesomeIcon className="main__fontAwesome--notShowing" icon={faWineGlassAlt} />}</button>
                                    </div>
                                </div>
                            </div>
                        <MapWithMarkerClusterer
                            getInfoFromDirections = {
                                this.getInfoFromDirections
                            }
                            getMarkerMidPoint = {
                                this.getMarkerMidPoint
                            }
                            markerMidPoint={this.state.markerMidPoint}
                            userCoordinatesLat = {
                                this.props.userCoordinatesLat
                            }
                            userCoordinatesLng = {
                                this.props.userCoordinatesLng
                            }
                            markers = {
                                this.props.markers
                            }
                            runDirections={this.state.runDirections}
                            userMOT = {
                                this.props.userMOT
                            }
                        />
                        </div>

                        
                        {/* this ternary statement will call directions on mymapcomponent */}
                        
                        {
                            this.state.markerMidPoint.lat  
                            ?
                            
                                this.getSelectedInfo()
                            : 
                            null
                        }
                    </div>
                </div>
            </div>
        )
    }
}

export default Main