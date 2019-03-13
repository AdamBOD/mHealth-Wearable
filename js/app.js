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

var SAAgent, SASocket, connectionListener;
var heartbeatBPM = 0;
var heartrateData = {};
var exerciseData = {};
var sleepData = {};

tizen.humanactivitymonitor.start("PEDOMETER", onchangedCB);

function onchangedCB (pedometerdata) {
	console.log ("Pedometer started. " + pedometerdata);
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
	        	console.log (reason);
	        };

	        SASocket.setSocketStatusListener(onConnectionLost);

	        dataOnReceive =  function dataOnReceive (channelId, data) {
	        	var requestedSensor;
	        	var heartrateSendCounter;
	        	var averageHeartrate;

	            if (!SAAgent.channelIds[0]) {
	            	window.alert ("Invalid Channel ID");
	                return;
	            }
	            
	            if (data === "Heart") {
	            	requestedSensor = data;
	            	averageHeartrate = 0;
	            	heartrateSendCounter = 0;
	            	window.webapis.motion.start("HRM", onchanged);
	            }
	            else if (data === "Exercise") {
	            	window.webapis.motion.stop("HRM");
             		tizen.humanactivitymonitor.stop("HRM");
	            	tizen.humanactivitymonitor.getHumanActivityData("PEDOMETER", onsuccessCB, onerrorCB);
	            	requestedSensor = data;
	            }
	            else if (data === "Sleep") {
	            	window.webapis.motion.stop("HRM");
             		tizen.humanactivitymonitor.stop("HRM");
	            	SASocket.sendData(SAAgent.channelIds[0], JSON.stringify(sleepData));
	            	requestedSensor = data;
	            }
	            else if (data === "Retry") {
	            	if (requestedSensor === "Heart") {
	            		window.webapis.motion.stop("HRM");
	             		tizen.humanactivitymonitor.stop("HRM");
	             		averageHeartrate = 0;
		            	heartrateSendCounter = 0;
		            	window.webapis.motion.start("HRM", onchanged);
	            	} else if (requestedSensor === "Exercise") {
	            		SASocket.sendData(SAAgent.channelIds[0], JSON.stringify(exerciseData));
	            	} else if (requestedSensor === "Sleep") {
	            		SASocket.sendData(SAAgent.channelIds[0], JSON.stringify(sleepData));
	            	}
	            }
	            else if (data === "Init") {
	            	tizen.humanactivitymonitor.getHumanActivityData("PEDOMETER", onsuccessCB, onerrorCB);
	            }
	            else if (data === "Reset") {
	            	if (resetPedometer()) {
	            		tizen.humanactivitymonitor.getHumanActivityData("PEDOMETER", onsuccessCB, onerrorCB);
	            	}	            	
	            }
	            else if (data === "StopHeart") {
	            	window.webapis.motion.stop("HRM");
             		tizen.humanactivitymonitor.stop("HRM");
	            }
	            
	            function onchanged (heartrateInfo) {
            		heartbeatBPM = heartrateInfo.heartRate;
		      	 	if (heartbeatBPM !== "undefined") {
		      	 		if (heartbeatBPM > 0) {		      	 			
		      	 			if (heartrateSendCounter < 15) {
		      	 				averageHeartrate += heartbeatBPM;
		      	 				heartrateSendCounter ++;		      	 				
		      	 			} else {
		      	 				averageHeartrate = Math.trunc(averageHeartrate / 15);
		      	 				heartrateData = {
		      	 					type: "Heart",
		      	 					heartrate: averageHeartrate
		      	 				};
		      	 				SASocket.sendData(SAAgent.channelIds[0], JSON.stringify(heartrateData));
		      	 				window.webapis.motion.stop("HRM");
			      	 			tizen.humanactivitymonitor.stop("HRM");
			      	 			heartrateSendCounter = 0;
		      	 			}
		      	 		} else if (heartbeatBPM < 0) {
		      	 			window.webapis.motion.stop("HRM");
		             		tizen.humanactivitymonitor.stop("HRM");
		             		SASocket.sendData(SAAgent.channelIds[0], "Error getting data from watch.");
		      	 		}      	            
	             	}	      	    	
	            }
	            
	            function onsuccessCB(pedometerInfo) {
	            	exerciseData = {
	            		type: "Exercise",
	            		stepCount: pedometerInfo.cumulativeTotalStepCount,
	            		calories: pedometerInfo.cumulativeCalorie,
	            		frequency: pedometerInfo.walkingFrequency
	            	};
	            	SASocket.sendData(SAAgent.channelIds[0], JSON.stringify(exerciseData));
       		 	}

       		 	function onerrorCB(error) {
       		 		console.log (error);
       		 		SASocket.sendData(SAAgent.channelIds[0], "Error getting data from watch.");
       		 	}
	        };

	        SASocket.setDataReceiveListener(dataOnReceive);
	    },
	    onerror: function (errorCode) {
	    	console.log (errorCode);
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

function resetPedometer () {
	tizen.humanactivitymonitor.stop("PEDOMETER");
	tizen.humanactivitymonitor.start("PEDOMETER", onchangedCB);
	return true;
}

function requestOnError (e) {
	window.alert ("requestSAAgent Error " + "Error name : " + e.name + " " + "Error message : " + e.message);
}

function createSleepHandler () {
	console.log ("Starting Sleep Recording");
	tizen.humanactivitymonitor.start('SLEEP_MONITOR', onchangedCB);
	
	function onchangedCB (sleepInfo) {
    	sleepData = {
			type: "Sleep",
    		status: sleepInfo.status,
    		timestamp: sleepInfo.timestamp
    	};
    }
}

createSleepHandler();

webapis.sa.requestSAAgent(requestOnSuccess, requestOnError);
