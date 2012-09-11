'use strict';


angular.module('cycle.controllers', []);

function DefaultController($scope, $http, $location, App, Event) {
  
  // TODO: get from cookie
  $scope.currentUser = null;
  
  $http.get(App.uri('currentUser')).success(function(data) {
    $scope.currentUser = data;
  });
  
  $scope.$on(Event.userChanged, function(event, user) {
    $scope.currentUser = user;
  });
  
  // Bread Crumb 
  var breadCrumbs = $scope.breadCrumbs = [];
  	
  $scope.$on(Event.navigationChanged, function(evt, navigationItem) {
    if(navigationItem==undefined) {
      breadCrumbs.splice(0, breadCrumbs.length);
    } else {
      var contains = false;
      var remove = 0;
      angular.forEach(breadCrumbs, function(item) {
        if(item.name == navigationItem.name) {
          contains = true;			
        }
        if(item.href.indexOf($location.path()) != 0) {
          remove++;
        }
      });

      for (var i = 0; i < remove; i++) {
        breadCrumbs.pop();						
      }

      if(!contains) {
        breadCrumbs.push({name:navigationItem.name, href:$location.path()});
      }		
    }
  });
  // end Bread Crumb
};

function HomeController($scope, Event) {
  $scope.$emit(Event.navigationChanged);
}

function RoundtripDetailsController($scope, $routeParams, RoundtripDetails, Commons, Event) {
  $scope.currentPicture = 'leftHandSide';
  
  $scope.syncDialog = new Dialog();
  $scope.syncDialog.setAutoClosable(false);
  
  //get roundtrip details and forward to main page if bad request (ie. invalid id) occurs
  $scope.roundtrip = RoundtripDetails.get({id: $routeParams.roundtripId }, function() {}, function(response) {
    if (response.status == 400) {
      $location.path("/");
    }
  });
  
  $scope.openSyncDialog = function (syncMode) {
    $scope.syncMode = syncMode;
    $scope.syncDialog.open();
  };
  
  $scope.$on(Event.roundtripChanged, function(event, roundtrip) {
    $scope.roundtrip = roundtrip;
  });
  
  $scope.$on(Event.modelImageClicked, function(event, side) {
    $scope.setCurrentPicture(side);
    
    $('.leftHandSide').removeClass("active");
    $('.rightHandSide').removeClass("active");
    
    $('.'+side).addClass("active");
    
    $('#pictureModal').modal('show');
  });
  
  $scope.imageUrl = function (side) {
    switch(side) {
    case "leftHandSide":
      return Commons.getImageUrl($scope.roundtrip.leftHandSide);
    case "rightHandSide":
      return Commons.getImageUrl($scope.roundtrip.rightHandSide);
    default:
      return "";
    }
  };
  
  $scope.setCurrentPicture = function (picture) {
    $scope.currentPicture = picture;
  };
};

function SyncRoundtripController($scope, $http, App, Event) {
  
  var SYNC_SUCCESS = "synchronizationSuccess",
      SYNC_FAILED = "synchronizationFailed",
      PERFORM_SYNC = "performSynchronize",
      BEFORE_SYNC = "beforeStart";
      
  
  $scope.status = BEFORE_SYNC;
  
  $scope.cancel = function () {
    $scope.syncDialog.close();
  };
  
  $scope.performSync = function() {
    $scope.status = PERFORM_SYNC;
    
    $http.post(App.uri('secured/resource/roundtrip/' + $scope.roundtrip.id + '/sync?syncMode=' + $scope.syncMode)).
      success(function(data) {
        $scope.status = SYNC_SUCCESS;
        $scope.$emit(Event.roundtripChanged, data);
    }).
      error(function (data) {
        $scope.status = SYNC_FAILED;
      });
  };
}

/**
 * Works along with the bpmn-diagram directive to manage a single bpmn-diagram in the roundtrip view.
 */
function BpmnDiagramController($scope, App, Commons, Event) {
  $scope.imageAvailable = false;
  
  $scope.editDiagramDialog = new Dialog();
  
  $scope.addDiagram = function() {
    $scope.editDiagramDialog.open();
  };
 
  $scope.cancelAddDiagram = function() {
    $scope.editDiagramDialog.close();
  };
  
  $scope.saveDiagram = function(diagram) {
    $scope.roundtrip[$scope.identifier] = diagram;
    
    $scope.roundtrip.$save(function() {
      $scope.editDiagramDialog.close();
    });
  };
  
  $scope.showImage = function(side) {
    $scope.$emit(Event.modelImageClicked, side);
  };
  
  $scope.$watch("diagram", function (newDiagramValue) {
    if (newDiagramValue != undefined) {
      $scope.imageUrl = Commons.getImageUrl(newDiagramValue);
      $scope.checkImageAvailable();
    }
  });
  
  $scope.$on(Event.roundtripChanged, function(event, roundtrip) {
    $scope.imageUrl = Commons.getImageUrl($scope.diagram, true);;
  });
  
  $scope.checkImageAvailable = function () {
    if ($scope.diagram) {
      Commons.isImageAvailable($scope.diagram.connectorId, $scope.diagram.diagramPath).then(function (data) {
        $scope.imageAvailable = data;
      });
    }
  }
}

/**
 * Realizes the edit operation of a bpmn diagram inside the respective dialog.
 */
function EditDiagramController($scope,Commons,Event) {
  
  var FOX_DESIGNER = "fox designer", 
      RIGHT_HAND_SIDE = "rightHandSide";

  // Can the modeler name be edited?
  var canEditModeler = $scope.canEditModeler = function() {
    return !!($scope.identifier != RIGHT_HAND_SIDE || ($scope.editDiagram.modeler && $scope.editDiagram.modeler != FOX_DESIGNER));
  };
    
  // is the dialog model valid and can be submitted?
  var isValid = $scope.isValid = function() {
    var editDiagram = $scope.editDiagram;
    return !!editDiagram.modeler && ($scope.addModelForm.$valid !== false) && ($scope.selectedNode ? $scope.selectedNode.type == 'FILE' : false);
  };
  
  $scope.cancel = function() {
    $scope.cancelAddDiagram();
  };
  
  // save the dialog 
  $scope.save = function() {
    if (!isValid()) {
      return;
    }
    $scope.saveDiagram($scope.editDiagram);
  };

  $scope.modelerNames = [];
  $scope.connectors = [];
  
  // make a copy of the diagram to edit / add
  $scope.editDiagram = angular.copy($scope.diagram || {});

  // Watch for component error  
  $scope.$on(Event.componentError, function(event, error) {
    $scope.error = error;
  });
  
  // Watch for change in diagram path
  $scope.$watch('selectedNode', function(newValue) {
    if (newValue) {
      $scope.editDiagram.diagramPath = newValue.id;
      $scope.editDiagram.label = newValue.label;
      $scope.editDiagram.connectorId = newValue.connectorId;
      
      console.log("selectedNode", newValue);
      console.log("scope.roundtrip", $scope.roundtrip);
    }
  });
  
  // set modeler name as fox designer whenever a right hand side 
  // diagram with no name is edited
  // relaxed implements AT in HEMERA-2549
  if (!canEditModeler()) {
    $scope.editDiagram.modeler = FOX_DESIGNER;
  }
  
  // Error to be displayed in dialog
  $scope.error = null;
  
  // TODO: nico.rehwaldt: On update: How to initially display the right folder structure?
  // 
  // get required data
  Commons.getModelerNames().then(function(data) {
    // filter out FOX_DESIGNER
    for (var i = data.length-1; i >= 0; i--) {
      if (angular.equals(data[i], FOX_DESIGNER)) {
        data.splice(i, 1);
        break;
      }
    }

    $scope.modelerNames = data;
    // set default value
    if (data.length > 0 && canEditModeler()) {
      $scope.editDiagram.modeler = data[0];
    }
  });
  
  $scope.connectors = Commons.getConnectors();
}

/**
 * Responsible for adding a new roundtrip from within the roundtrip list
 * 
 */
function CreateNewRoundtripController($scope, $q, $http, $location, Debouncer, App, Roundtrip, Event) {

  $scope.name = '';
  $scope.nameChecked = false;
  
  $scope.errorClass = function(form) {
    return form.$valid || !form.$dirty ? '' : 'error';
  };
  
  // watch the name to check its validity on change
  $scope.$watch('name', function(newValue, oldValue) {
    $scope.nameChecked = false;
    $scope.newRoundtripForm.name.$setValidity("unused", true);
    checkName(newValue, oldValue);
  });
  
  // cancel the add operation áka close the dialog
  $scope.cancel = function() {
    $scope.newRoundtripDialog.close();
  };
  
  // is the dialog model valid and can be submitted?
  var isValid = $scope.isValid = function() {
    return $scope.newRoundtripForm.$valid && $scope.nameChecked;
  };
  
  // save the dialog 
  $scope.save = function() {
    if (!isValid()) {
      return;
    }
    
    var roundtrip = new Roundtrip({ name: $scope.name });
    
    // redirect to created roundtrip after save and close dialog
    roundtrip.$save(function() {
      $scope.newRoundtripDialog.close();
      
      $location.path("/roundtrip/" + roundtrip.id);
      $scope.$emit(Event.roundtripAdded, roundtrip);
    });
  };
  
  /**
   * Checking the name of an argument maximum every 1000ms
   * and update the model respectively
   */
  var checkName = Debouncer.debounce(function(name) {
    isNameValid(name).then(function(valid) {
      $scope.nameChecked = true;
      
      if ($scope.newRoundtripForm.name) {
        $scope.newRoundtripForm.name.$setValidity("unused", valid);
      }
    });
  }, 500);
  
  /**
   * Checks the validity of a name in the backend.
   * Returns a promise which is fulfilled when the check was done. 
   * 
   * Usage: 
   * isNameValid("Walter").then(function(nameOk) {
   *   console.log("Name 'Walter' is ok? ", nameOk);
   * });
   * 
   * @param name to be checked
   * 
   * @returns promise to be fulfilled when the check was done
   */ 
  function isNameValid(name) {
    var deferred = $q.defer();
    
    if (!name || name == "") {
      deferred.resolve(true);
    } else {
      $http.get(App.uri("secured/resource/roundtrip/isNameValid?name=" + name)).success(function(data) {
        deferred.resolve(data == "true");
      });
    }
    
    return deferred.promise;
  }
};

/**
 * Responsible for listing the roundtrips and updating the currently selected one
 * 
 */
function ListRoundtripsController($scope, $routeParams, Roundtrip, Event) {
  
  // TODO: Add documentation page
  $scope.roundtrips = Roundtrip.query();
  $scope.newRoundtripDialog = new Dialog();
  
  var selectedRoundtripId = null; 
  
  // Update the selected roundtrip on route change
  $scope.$watch(function() { return $routeParams.roundtripId; }, function(newValue, oldValue) {
    if (newValue) {
      selectedRoundtripId = parseInt(newValue);
      if (isNaN(selectedRoundtripId)) {
        selectedRoundtripId = -1;
      } else {
        angular.forEach($scope.roundtrips, function(item) {
          if (item.id == $routeParams.roundtripId) {
            // find the roundtripname for this roundtrip-id
            $scope.$emit(Event.navigationChanged, {name:item.name});
          }
        });
      }
    } else {
      selectedRoundtripId = -1;
    }
  });
  
  $scope.createNew = function() {
    $scope.newRoundtripDialog.open();
  };
  
  $scope.activeClass = function(roundtrip) {
    return (roundtrip.id == selectedRoundtripId ? 'active' : '');
  };
  
  $scope.$on(Event.roundtripAdded, function(event, roundtrip) {
    $scope.roundtrips.push(roundtrip);
  });
};
