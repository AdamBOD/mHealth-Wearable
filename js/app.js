/*
 * Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global console, define */

/**
 * App module.
 *
 * @module app
 * @requires {@link views/init}
 * @namespace app
 */

define({
    name: 'app',
    requires: [
        'views/init'
    ],
    def: function appInit() {
        'use strict';

        console.log('app::def');

        /**
         * Initializes App module.
         *
         * @memberof app
         * @public
         */
        function init() {
            console.log('app::init');
        }

        return {
            init: init
        };
    }
});

var stepCount, stepStatus, speed, walkingFrequency;
var SAAgent, SASocket, connectionListener

connectionListener = {
	    /* Remote peer agent (Consumer) requests a service (Provider) connection */
	    onrequest: function (peerAgent) {

	        //createHTML("peerAgent: peerAgent.appName<br />" +
	                    //"is requsting Service conncetion...");

	        /* Check connecting peer by appName*/
	        if (peerAgent.appName === "WatchService") {
	            SAAgent.acceptServiceConnectionRequest(peerAgent);
	            //createHTML("Service connection request accepted.");

	        } else {
	            SAAgent.rejectServiceConnectionRequest(peerAgent);
	            //createHTML("Service connection request rejected.");

	        }
	    },

	    /* Connection between Provider and Consumer is established */
	    onconnect: function (socket) {
	        var onConnectionLost,
	            dataOnReceive;

	        //createHTML("Service connection established");

	        /* Obtaining socket */
	        SASocket = socket;

	        onConnectionLost = function onConnectionLost (reason) {
	            //createHTML("Service Connection disconnected due to following reason:<br />" + reason);
	        };

	        /* Inform when connection would get lost */
	        SASocket.setSocketStatusListener(onConnectionLost);

	        dataOnReceive =  function dataOnReceive (channelId, data) {
	            //var newData;

	            if (!SAAgent.channelIds[0]) {
	                //createHTML("Something goes wrong...NO CHANNEL ID!");
	                return;
	            }
	            
	            function onsuccessCB(pedometerInfo) {
	            	stepCount=0;
	            	stepStatus=pedometerInfo.stepStatus;
	            	stepCount=pedometerInfo.cumulativeTotalStepCount;
	                console.log("Step status : " + pedometerInfo.stepStatus);
	                console.log("Cumulative total step count : " + pedometerInfo.cumulativeTotalStepCount);
	            }

	            function onerrorCB(error) {
	                console.log("Error occurs. name:"+error.name + ", message: "+error.message);
	            }

	            function onchangedCB(pedometerdata) {
	                console.log("From now on, you will be notified when the pedometer data changes.");
	                // To get the current data information
	                tizen.humanactivitymonitor.getHumanActivityData("PEDOMETER", onsuccessCB, onerrorCB);
	            } 
	            
	            tizen.humanactivitymonitor.start("PEDOMETER", onchangedCB);
	            
	            
	            //newData = data + " :: " + new Date();

	            /* Send new data to Consumer */
	            SASocket.sendData(SAAgent.channelIds[0], stepCount);
	            //createHTML("Send massage:<br />" +
	                        //newData);
	        };

	        /* Set listener for incoming data from Consumer */
	        SASocket.setDataReceiveListener(dataOnReceive);
	    },
	    onerror: function (errorCode) {
	        //createHTML("Service connection error<br />errorCode: " + errorCode);
	    }
	};

function requestOnSuccess (agents) {
    var i = 0;

    for (i; i < agents.length; i += 1) {
        if (agents[i].role === "PROVIDER") {
            //createHTML("Service Provider found!<br />" +
                        //"Name: " +  agents[i].name);
            SAAgent = agents[i];
            break;
        }
    }

    /* Set listener for upcoming connection from Consumer */
    SAAgent.setServiceConnectionListener(connectionListener);
}

function requestOnError (e) {
    //createHTML("requestSAAgent Error" +
                //"Error name : " + e.name + "<br />" +
                //"Error message : " + e.message);
}

/* Requests the SAAgent specified in the Accessory Service Profile */
webapis.sa.requestSAAgent(requestOnSuccess, requestOnError);
