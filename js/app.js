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
/*
/**
 * App module.
 *
 * @module app
 * @requires {@link views/init}
 * @namespace app
 */
/*
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
/*
        function init() {
            console.log('app::init');
        }

        return {
            init: init
        };
    }
});*/

var stepCount, stepStatus, speed, walkingFrequency;
var SAAgent, SASocket, connectionListener;
var heartbeatBPM = 0;
var exerciseData = {};

tizen.humanactivitymonitor.start("PEDOMETER", onchangedCB);

function onchangedCB (pedometerdata) {
	console.log ("Pedometer started")
}

connectionListener = {
	    onrequest: function (peerAgent) {
	        if (peerAgent.appName === "mHealthMobile") {
	            SAAgent.acceptServiceConnectionRequest(peerAgent);

	        } else {
	            SAAgent.rejectServiceConnectionRequest(peerAgent);
	            window.alert("Rejected connection to phone");
	        }
	    },
	    
	    onconnect: function (socket) {
	        var onConnectionLost,
	            dataOnReceive;

	        SASocket = socket;

	        onConnectionLost = function onConnectionLost (reason) {
	        	
	        };

	        SASocket.setSocketStatusListener(onConnectionLost);

	        dataOnReceive =  function dataOnReceive (channelId, data) {
	        	var requestedSensor;

	            if (!SAAgent.channelIds[0]) {
	            	window.alert ("Invalid Channel ID");
	                return;
	            }
	            
	            if (data === "Heart") {
	            	requestedSensor = data;
	            	window.webapis.motion.start("HRM", onchanged);
	            }
	            else if (data === "Exercise") {
	            	tizen.humanactivitymonitor.getHumanActivityData("PEDOMETER", onsuccessCB, onerrorCB);
	            	requestedSensor = data;
	            }
	            else if (data === "Sleep") {
	            	requestedSensor = data;
	            	tizen.humanactivitymonitor.start('SLEEP_MONITOR', onchangedCB);
	            }
	            else if (data === "Retry") {
	            	if (requestedSensor === "Heart") {
	            		SASocket.sendData(SAAgent.channelIds[0], heartbeatBPM);
	            	} else if (requestedSensor === "Exercise") {
	            		SASocket.sendData(SAAgent.channelIds[0], exerciseData);
	            	}	            	
	            }	            
	            
	            function onchanged (heartrateInfo) {
            		heartbeatBPM = sensorData.heartRate;
		      	 	if (heartbeatBPM !== "undefined") {
		      	 		if (heartbeatBPM > 0) {
		      	 			SASocket.sendData(SAAgent.channelIds[0], heartbeatBPM);
		      	 			window.webapis.motion.stop("HRM");
		      	 			tizen.humanactivitymonitor.stop("HRM");
		      	 		}	      	            
	             	} else if (heartbeatBPM < 0) {
	             		window.webapis.motion.stop("HRM");
	             		tizen.humanactivitymonitor.stop("HRM");
	             		SASocket.sendData(SAAgent.channelIds[0], "Error getting data from watch.");
	             	}
	      	    	
	            }
	            
	            function onchangedCB (sleepInfo) {
	            	//window.status ("Sleep Recorded")
	            	var sleepData = {
	            		status: sleepInfo.status,
	            		timestamp: sleepInfo.timestamp
	            	}
	            	SASocket.sendData(SAAgent.channelIds[0], sleepData);
	            	window.alert ("Status: " + sleepInfo.status + "\n Time: " + sleepInfo.timestamp);
	            }
	            
	            function onsuccessCB(pedometerInfo) {
	            	var exerciseData = {
	            		stepCount: pedometerInfo.cumulativeTotalStepCount,
	            		calories: pedometerInfo.cumulativeCalorie,
	            		frequency: pedometerInfo.walkingFrequency
	            	}
	            	SASocket.sendData(SAAgent.channelIds[0], JSON.stringify(exerciseData));
       		 	}

       		 	function onerrorCB(error) {
       		 		SASocket.sendData(SAAgent.channelIds[0], "Error getting data from watch.");
       		 	}
	            
	            //tizen.humanactivitymonitor.start("PEDOMETER", onchangedCB);
	            
	            
	            //newData = data + " :: " + new Date();

	            /* Send new data to Consumer */
	            //SASocket.sendData(SAAgent.channelIds[0], stepCount);
	            //createHTML("Send massage:<br />" +
	                        //newData);
	        };

	        SASocket.setDataReceiveListener(dataOnReceive);
	    },
	    onerror: function (errorCode) {

	    }
	};

function requestOnSuccess (agents) {
    var i = 0;
    for (i; i < agents.length; i += 1) {
        if (agents[i].role === "PROVIDER") {
            SAAgent = agents[i];
            break;
        }
    }

    SAAgent.setServiceConnectionListener(connectionListener);
}



function requestOnError (e) {
	window.alert ("requestSAAgent Error " + "Error name : " + e.name + " " + "Error message : " + e.message);
}

webapis.sa.requestSAAgent(requestOnSuccess, requestOnError);
