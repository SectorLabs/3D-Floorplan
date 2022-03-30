document.addEventListener("gesturestart", function (e) {
  e.preventDefault();
});

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}


// firstfloorindex = [0, 1, 5, 2, 7, 9, 8, 10];

var firstfloorindex = [];
var groundfloorindex = [];

// groundfloorindex = [0, 3, 6, 4, 14, 15, 11, 12, 13];
var iframe = document.getElementById("api-frame");
var url = getParameterByName("urlid");

var prefix = getParameterByName("prefix");
var DEFAULT_URLID = default_inventory;
var SELECTED_MODEL = DEFAULT_URLID;
var DEFAULT_PREFIX = "bed ";
var stopAnimation = true;
var intervalForAutoPilot;
var dynamicMarginAutoPilot = "30%";
var mobileFullScreen = false;
var CONFIG = {
  urlid: url !== "" ? url : DEFAULT_URLID,
  prefix: prefix !== "" ? prefix : DEFAULT_PREFIX,
};
var groupLayer = false;




// for (var keyss in global_dict[SELECTED_MODEL]) {
//   console.log("I am floorplan group id")
//   console.log(floorplans_groups);
//   if ("group" in global_dict[SELECTED_MODEL][keyss]) {
//     console.log(global_dict[SELECTED_MODEL][keyss])
//   }
// }
document.getElementById("auto-pilot").style.left = "16%";




var Configurator = {
  api: null,
  config: null,
  options: [],
  fullroot_model_id: 81,

  /**
   * Initialize viewer
   */
  init: function (config, iframe) {
    this.config = config;
    var client = new Sketchfab(iframe);
    document.getElementById('scenes').style.pointerEvents = 'none';

    client.init(config.urlid, {

      ui_infos: 0,
      ui_controls: 0,
      ui_watermark: 0,
      ui_watermark_link: 0,
      graph_optimizer: 0,
      ui_annotations: 1,
      ui_general_controls: 0,
      camera: 0,
      success: function onSuccess(api) {
        console.log(config.urlid);
        api.start();
        api.addEventListener(
          "viewerready",
          function () {
            this.api = api;
            this.api.recenterCamera();
            document.getElementById('scenes').style.pointerEvents = 'auto';
            document.getElementById('scenes').style.backgroundColor = '#f7f7f7 0 % 0 % no - repeat padding - box';
            document.getElementById('scenes').style.opacity = 1;
            this.initializeOptions(
              function () {
                console.log("Found the following options:", this.options);
                UI.init(this.config, this.options);
              }.bind(this)
            );
          }.bind(this)
        );
        // api.addEventListener("annotationMouseLeave", function (info) {
        // 	annotationSelect();
        // });
      }.bind(this),
      error: function onError() {
        console.log("Viewer error");
      },
    });
  },

  /**
   * Initialize options from scene
   */
  initializeOptions: function initializeOptions(callback) {
    this.api.getNodeMap(
      function (err, nodes) {
        // if (err) {
        // 	console.error(err);
        // 	return;
        // }
        if (!err) {
          // console.log(nodes);
        }
        var node;
        var isOptionObject = false;
        var keys = Object.keys(nodes);
        // this.api.recenterCamera();
        for (var i = 0; i < keys.length; i++) {
          node = nodes[keys[i]];
          if (
            node.instanceID == "488" ||
            node.instanceID == "6895" ||
            node.instanceID == "81"
          ) {
            alt_names = {
              488: "Show Ground Floor Only",
              6895: "Show First Floor Only",
              81: "Show Complete Building",
            };

            this.options.push({
              id: node.instanceID,
              name: node.name,
              selected: false,
              alt_name: alt_names[node.instanceID.toString()],
            });
          }
        }
        callback();
      }.bind(this)
    );
  },

  /**
   * Select option to show
   */
  selectOption: function selectOption(index) {
    var options = this.options;
    if (options[index].id == this.fullroot_model_id) {
      for (var i = 0, l = options.length; i < l; i++) {
        this.api.show(options[i].id);
      }
    } else {
      for (var i = 0, l = options.length; i < l; i++) {
        if (i === index) {
          options[i].selected = true;
          this.api.show(options[i].id);
        } else {
          if (options[i].id != this.fullroot_model_id) {
            options[i].selected = false;
            this.api.hide(options[i].id);
          }
        }
      }
    }
  },

  zoomToAnnotation: function zoomToAnnotation(index) {
    // this.api.recenterCamera();
    this.api.gotoAnnotation(
      index,
      {
        preventCameraAnimation: false,
        preventCameraMove: false,
      },
      function (err, index) {
        if (!err) {
          console.log("Going to annotation", index + 1);
        }
      }
    );
  },

  hideThisAnnotation: function hideThisAnnotation(index) {
    this.api.hideAnnotation(index);
  },

  showThisAnnotation: function showThisAnnotation(index) {
    this.api.showAnnotation(index);
  },

  centerCamera: function centerCamera() {
    this.api.recenterCamera();
  },

  hideParts: function hideParts(myNode) {
    for (var key in global_dict) {
      this.api.hide(myNode);
    }
  },

  showParts: function showParts(myNode) {
    for (var key in global_dict) {
      this.api.show(myNode);
    }
  },
  startautopilot: function startautopilot(myNode) {
    this.api.play();
  },
};

var UI = {
  config: null,
  options: null,
  init: function init(config, options) {
    this.config = config;
    this.options = options;
    this.el = document.querySelector(".options");
    this.render();
    this.el.addEventListener(
      "change",
      function (e) {
        e.preventDefault();
        var index = parseInt(this.el.elements["color"].value, 10);
        this.select(index);
      }.bind(this)
    );
  },

  select: function (index) {
    Configurator.selectOption(parseInt(index, 10));
    this.render();
  },
  /* 
  render: function () {
    if (this.config.urlid === DEFAULT_URLID) {
      this.renderRadio();
    } else {
      this.renderSelect();
    }
  }, */

  /**
   * Render options as multiple `<input type="radio">`
   */
  /*   renderRadio: function render() {
    var html = this.options
      .map(
        function (option, i) {
          var checkedState = option.selected ? 'checked="checked"' : "";
          var className = option.name.replace(this.config.prefix, "");
          return [
            '<label class="options__option">',
            '<input type="radio" name="color" value="' +
              i +
              '" ' +
              checkedState +
              ">",
            '<span class="' + className + '">' + option.alt_name + "</span>",
            "</label>",
          ].join("");
        }.bind(this)
      )
      .join("");
    this.el.innerHTML = html;
  }, */

  /**
   * Render option as `<select>`
   */
  /*   renderSelect: function () {
    var html = this.options
      .map(function (option, i) {
        var checkedState = option.selected ? 'selected="selected"' : "";
        return [
          '<option value="' + i + '" ' + checkedState + ">",
          option.name,
          "</option>",
        ].join("");
      })
      .join("");
    this.el.innerHTML = '<select name="color">' + html + "</select>";
  }, */
};


$("#apartment_rightpanel").attr(
  "src",
  global_dict[DEFAULT_URLID]["Full View"]["image_path"]
);

Configurator.init(CONFIG, iframe);

function changeIframeModel(id) {
  firstfloorindex = [];
  groundfloorindex = [];
  // console.log(global_dict[id][key]);


  for (var key in global_dict[id]) {

    if ("group" in global_dict[id][key]) {

      if (global_dict[id][key]["group"] == "upper-floor") {
        // console.log(global_dict[id][key]["annotation_index"])
        firstfloorindex.push(global_dict[id][key]["annotation_index"])
      }
      else if (global_dict[id][key]["group"] == "lower-floor") {
        // console.log(global_dict[id][key]["annotation_index"])
        groundfloorindex.push(global_dict[id][key]["annotation_index"])
      }

    }
  }

  if (id != SELECTED_MODEL) {
    document.getElementById('scenes').style.pointerEvents = 'none';
    // $("#scenes").css({ backgroundColor: 'rgba(255, 255, 255, 0.5)' });
    document.getElementById('scenes').style.opacity = 0.5;
  }
  if (!groupLayer) {
    $("#penthousetypeb").hide();
    $("#penthousetypeb").css({ display: 'none' });
    // if ($(".floor_toggle").is(":visible")) {
    //   $(".floor_toggle").hide();
    // }
  } else {
    $("#penthousetypeb").show();
    $("#penthousetypeb").css({ display: 'block' });

  }
  // Hide side bar on mobile if a model on left panel is selected.
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    $("#sidebar").removeClass("active"); //hide side bar

    // checking if it's landscape orientation then don't hide the project views
    if (window.innerHeight < window.innerWidth) {
    } else {
      $(".project-views").hide();
    }

    $("#mobile-select-view").removeClass("change");
    $("#mobile-select-view").removeClass("change2");
    $("#upper_floor").hide();
    $("#lower_floor").hide();
  }


  // debugger;
  stopAnimation = true;
  startAnimation();
  $("#selected_apartment_name").text(models_names_ids[id]);
  if (id != SELECTED_MODEL) {
    SELECTED_MODEL = id;
    var DEFAULT_URLID = id;
    var DEFAULT_PREFIX = "bed ";
    var CONFIG = {
      urlid: url !== "" ? url : DEFAULT_URLID,
      prefix: prefix !== "" ? prefix : DEFAULT_PREFIX,
    };

    $("#apartment_rightpanel").attr(
      "src",
      global_dict[DEFAULT_URLID]["Full View"]["image_path"]
    );
  }

  Configurator.init(CONFIG, iframe);
  document.getElementById("annotation-views").innerHTML = "";


  for (var key in global_dict[id]) {
    if (key == "Full View") {
      $("#apartment_rightpanel").attr(
        "src",
        global_dict[id][key]["image_path"]
      );
    } else {
      if ("group" in global_dict[id][key]) {

        if (global_dict[id][key]["group"] == "upper-floor") {
          // console.log(global_dict[id][key]["annotation_index"])
          firstfloorindex.push(global_dict[id][key]["annotation_index"])
        } else if (global_dict[id][key]["group"] == "lower-floor") {
          // console.log(global_dict[id][key]["annotation_index"])
          groundfloorindex.push(global_dict[id][key]["annotation_index"])
        }



        // console.log(firstfloorindex);
        // console.log(groundfloorindex);

        // debugger;        
        groupLayer = true;
        $("#penthousetypeb").css({ display: 'block' });
        var myEle = document.getElementById(global_dict[id][key]["group"]);
        if (myEle != null) {
          $(
            `<div class="annotation-view-group"><img class="img-icon-project-view" onclick= 'setDropdown(` +
            global_dict[id][key]["annotation_index"] +
            `)' src="` +
            global_dict[id][key]["image_path"] +
            `"
                        id="apartment_parts"> <h5>` +
            key +
            `</h5></div>`
          ).appendTo("#" + global_dict[id][key]["group"] + "-div");
        } else {
          $(
            '<button type="button" id="' +
            global_dict[id][key]["group"] +
            '" class="collapsible">' +
            global_dict[id][key]["group"].replace("-", " ") +
            "</button>"
          ).appendTo(".annotation-views");
          $(
            '<div id="' +
            global_dict[id][key]["group"] +
            '-div" class="content" style="display:none; height: 15em; overflow: auto; overflow-x: hidden; "> </div>'
          ).appendTo(".annotation-views");

          $(
            `<div class="annotation-view-group"><img class="img-icon-project-view" onclick= 'setDropdown(` +
            global_dict[id][key]["annotation_index"] +
            `)' src="` +
            global_dict[id][key]["image_path"] +
            `"
                        id="apartment_parts"> <h5>` +
            key +
            `</h5></div>`
          ).appendTo("#" + global_dict[id][key]["group"] + "-div");
        }
      }
      else {
        groupLayer = false;
        $("#penthousetypeb").css({ display: 'none' });
        $(
          `<div class="annotation-view"><img class="img-icon-project-view" onclick= 'setDropdown(` +
          global_dict[id][key]["annotation_index"] +
          `)' src="` +
          global_dict[id][key]["image_path"] +
          `"
                    id="apartment_parts"> <h5>` +
          key +
          `</h5></div>`
        ).appendTo(".annotation-views");
      }
    }
  }

  console.log(firstfloorindex);
  console.log(groundfloorindex);



  var coll = document.getElementsByClassName("collapsible");
  var i;

  for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function () {
      this.classList.toggle("active");
      var content = this.nextElementSibling;
      if (content.style.display === "contents") {
        content.style.display = "none";
      } else {
        content.style.display = "contents";
      }
    });
  }
}


function setDropdown(id, fullview = "none") {
  // zoom on to the annotation.
  clearInterval(intervalForAutoPilot);
  startAnimation();
  stopAnimation = true;
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    if (fullview == "full_view") {
      $("#mobile-select-view").click();
      Configurator.zoomToAnnotation(id);
    } else {
      Configurator.zoomToAnnotation(id);
    }
  } else {
    Configurator.zoomToAnnotation(id);
  }
}

jQuery(document).ready(function ($) {
  $(".aptClass").on({
    click: function () { },
  });
  $(".menuClass li a").on("click", function (e) {
    $(".menuClass .active").removeClass("active");
    $(this).parent().addClass("active");
    e.preventDefault();
  });

  $(".menuClass").on({
    click: function () {
      // $("#apartment").attr("src", "images/updated/Aurum.jpg");
      $(".aptClass").prop("value", "Select a View");
    },
  });


  $(".groundfloor").on({
    click: function () {

      // SELECTED_MODEL = "groundfloorsomeid";
      clearInterval(intervalForAutoPilot);

      startAnimation();
      Configurator.zoomToAnnotation(0); //when switched between lower and upper it will show the full view.

      Configurator.hideParts(1);

      Configurator.showParts(floorplans_groups[SELECTED_MODEL]);
      Configurator.hideThisAnnotation(0);
      console.log("i am hiding firstfloor indexes: " + firstfloorindex[i])
      for (var i = 0, l = firstfloorindex.length; i < l; i++) {
        Configurator.hideThisAnnotation(firstfloorindex[i]);
        // Configurator.hideTooltip(firstfloorindex[i]);
      }

      for (var i = 0, l = groundfloorindex.length; i < l; i++) {
        Configurator.showThisAnnotation(groundfloorindex[i]);
        // Configurator.showTooltip(groundfloorindex[i]);
      }

      $("#apartment_rightpanel").attr(
        "src",
        global_dict[SELECTED_MODEL]["Full View"]["image_path"]
      );



      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        $(".project-views").hide();
        $("#mobile-select-view").removeClass("change2");
        $("#upper_floor").hide();
        $("#lower_floor").hide();
        $("#mobile-select-view").css({
          bottom: "1%",
        });

      }
      else {
        $("#upper-floor").hide();
        $("#upper-floor-div").hide();
        $("#lower-floor").show();
        $("#upper-floor").removeClass("active");
      }

      // document.getElementById("dpmenu").innerHTML = "";
      // for (var key in global_dict["groundfloorsomeid"]) {
      //   $(".dropmenu").append(
      //     "<a onclick= 'setDropdown(" +
      //     global_dict["groundfloorsomeid"][key]["annotation_index"] +
      //     ',"' +
      //     global_dict["groundfloorsomeid"][key]["image_path"] +
      //     '","' +
      //     key +
      //     '");\' class="dropdown-item" >' +
      //     key +
      //     "</a>"
      //   );
      // }


    },
  });


  $(".firstfloor").on({
    click: function () {
      // $("#lower-floor").hide();

      // SELECTED_MODEL = "";
      clearInterval(intervalForAutoPilot);
      startAnimation();
      $(".autostart").css("background-size", "10%");

      Configurator.zoomToAnnotation(0);
      Configurator.showParts(1);
      Configurator.hideParts(floorplans_groups[SELECTED_MODEL]);
      Configurator.hideThisAnnotation(0);
      for (var i = 0, l = groundfloorindex.length; i < l; i++) {
        Configurator.hideThisAnnotation(groundfloorindex[i]);
        // Configurator.hideTooltip(groundfloorindex[i]);
      }

      for (var i = 0, l = firstfloorindex.length; i < l; i++) {
        Configurator.showThisAnnotation(firstfloorindex[i]);
        // Configurator.showTooltip(firstfloorindex[i]);
      }
      // $("#apartment_rightpanel").attr(
      //   "src",
      //   "images/updated/upper_floor_typeb.jpg"
      // );

      // console.log("i am selected model " + SELECTED_MODEL)
      // console.log(global_dict[SELECTED_MODEL]["Full View"]["image_path"])

      $("#apartment_rightpanel").attr(
        "src",
        global_dict[SELECTED_MODEL]["Full View"]["image_path"]
      );

      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        $(".project-views").hide();
        $("#upper_floor").hide();
        $("#lower_floor").hide();
        $("#mobile-select-view").css({
          bottom: "1%",
        });
        $("#mobile-select-view").removeClass("change2");
      }
      else {

        $("#upper-floor").show();
        $("#lower-floor-div").hide();
        $("#lower-floor").removeClass("active");
        $("#lower-floor").hide();
      }
      // document.getElementById("dpmenu").innerHTML = "";

      // for (var key in global_dict["firstfloorsomeid"]) {
      //   $(".dropmenu").append(
      //     "<a onclick= 'setDropdown(" +
      //     global_dict["firstfloorsomeid"][key]["annotation_index"] +
      //     ',"' +
      //     global_dict["firstfloorsomeid"][key]["image_path"] +
      //     '","' +
      //     key +
      //     '");\' class="dropdown-item" >' +
      //     key +
      //     "</a>"
      //   );
      // }


    },
  });


  $(".fullview").on({
    click: function () {
      // SELECTED_MODEL = "groundfloorsomeid";
      Configurator.showParts(1);
      Configurator.showParts(floorplans_groups[SELECTED_MODEL]);
      Configurator.showThisAnnotation(0);
      for (var i = 0, l = groundfloorindex.length; i < l; i++) {
        Configurator.showThisAnnotation(groundfloorindex[i]);
        // Configurator.hideTooltip(groundfloorindex[i]);
      }

      for (var i = 0, l = firstfloorindex.length; i < l; i++) {
        Configurator.showThisAnnotation(firstfloorindex[i]);
        // Configurator.showTooltip(firstfloorindex[i]);
      }

      // $("#apartment_rightpanel").attr(
      //   "src",
      //   "images/updated/PenthouseTypeB_FullView.jpg"
      // );

      $("#apartment_rightpanel").attr(
        "src",
        global_dict[SELECTED_MODEL]["Full View"]["image_path"]
      );

      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        $(".project-views").hide();
        $("#upper_floor").hide();
        $("#lower_floor").hide();
        $("#mobile-select-view").css({
          bottom: "2%",
        });
        $("#mobile-select-view").removeClass("change2");
      } else {
        $("#upper-floor").show();
        $("#upper-floor-div").hide();
        $("#lower-floor-div").hide();
        $("#lower-floor").show();
      }

      // document.getElementById("dpmenu").innerHTML = "";
      // for (var key in global_dict[SELECTED_MODEL]) {
      //   $(".dropmenu").append(
      //     "<a onclick= 'setDropdown(" +
      //     global_dict[SELECTED_MODEL][key][
      //     "annotation_index"
      //     ] +
      //     ',"' +
      //     global_dict[SELECTED_MODEL][key]["image_path"] +
      //     '","' +
      //     key +
      //     '");\' class="dropdown-item" >' +
      //     key +
      //     "</a>"
      //   );
      // }

    },
  });


  $("#auto-pilot").on({
    click: function () {
      if (stopAnimation) {
        stopAnimation = false;
        document.getElementById("auto-pilot").value = "Stop Animation";

        if (window.innerHeight < window.innerWidth) {
          $(".autostart").css(
            "background",
            "url(/static/backend/img/stop-button_new.svg) #ffffff 4% no-repeat padding-box"
          );
          $(".autostart").css("background-size", "13%");
          $(".autostart").css("color", "black");
        } else {
          $(".autostart").css(
            "background",
            "url(/static/backend/img/stop-button_new.svg) #ffffff 6% no-repeat padding-box"
          );
          $(".autostart").css("background-size", "13%");
          $(".autostart").css("color", "black");
        }

        var counter = 0;
        var data = global_dict[SELECTED_MODEL];
        var keys = Object.keys(data);

        intervalForAutoPilot = setInterval(function () {
          Configurator.zoomToAnnotation(data[keys[counter]].annotation_index);
          // Configurator.centerCamera();
          if (counter >= keys.length - 1) {
            counter = 0;
          } else {
            counter++;
          }

          if (stopAnimation) {
            clearInterval(intervalForAutoPilot);
          }
        }, 2500);
      } else {
        stopAnimation = true;
        startAnimation();
        // $(".autostart").css("background-size", "10%");
        // $(".autostart").css(
        //   "background",
        //   "url(/static/backend/img/play.svg) #ffffff 6% no-repeat padding-box"
        // );
        // $(".autostart").css("background-size", "10%");

        clearInterval(intervalForAutoPilot);
      }
    },
  });




  for (var key in global_dict[DEFAULT_URLID]) {
    if (key != "Full View") {
      $(
        `<div class="annotation-view"><img class="img-icon-project-view" onclick= 'setDropdown(` +
        global_dict[DEFAULT_URLID][key]["annotation_index"] +
        `)' src="` +
        global_dict[DEFAULT_URLID][key]["image_path"] +
        `"
			id="apartment_parts"> <h5>` +
        key +
        `</h5></div>`
      ).appendTo(".annotation-views");
    }
  }

  $("#sidebarCollapse").click(function () {
    if (
      !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      if ($("#sidebar").hasClass("active")) {
        document.getElementById("auto-pilot").style.left = "1%";
        $("#selected_apartment_name").show();
      } else {
        document.getElementById("auto-pilot").style.left = "18%";
        document.getElementById("auto-pilot").style.width = 'fit - content';
        $("#selected_apartment_name").hide();
      }
    }
  });

  $("#img-fullscreen").click(function () {
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      if (!mobileFullScreen) {
        $("#selected_apartment_name").hide();
        $("#all-unit-text").css({
          display: "none",
        });
        // $("#sidebar").addClass("active");
        $("#sidebar-right").css({
          display: "none",
        });
        $("#auto-pilot").hide();
        $("#mobile-select-view").hide();
        $("#img-fullscreen").attr("src", "img/Group_FullScreen.svg");
        Configurator.centerCamera();
        mobileFullScreen = true;
      } else {
        $("#all-unit-text").css({
          display: "none",
        });
        // $("#sidebar").addClass("active");
        $("#sidebar-right").css({
          display: "inline-block",
        });
        $("#auto-pilot").show();
        $("#mobile-select-view").show();
        $("#img-fullscreen").attr("src", "img/Group_FullScreen.svg");
        mobileFullScreen = false;
      }
    } else {
      // close full screen
      if (
        window.innerWidth == screen.width &&
        window.innerHeight == screen.height
      ) {
        $("#img-fullscreen").attr("src", "img/Group 8434.svg");
        $("#sidebar").removeClass("active");
        $("#sidebar-right").css({
          display: "inline-block",
        });
        $("#selected_apartment_name").hide();
        $("#all-unit-text").css({
          display: "none",
        });
        // debugger;
        $("#auto-pilot").show();
        clearInterval(intervalForAutoPilot);
        startAnimation();
        Configurator.centerCamera();
        document.getElementById("auto-pilot").style.left =
          dynamicMarginAutoPilot;
        document.getElementById("auto-pilot").style.width = 'fit - content';

        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      } else {
        // opens full screen
        $("#sidebar").addClass("active");
        $("#sidebar-right").css({
          display: "none",
        });
        $("#img-fullscreen").attr("src", "img/Group_FullScreen.svg");
        $("#selected_apartment_name").show();
        $("#all-unit-text").css({
          display: "inline-block",
        });
        $("#auto-pilot").hide();
        clearInterval(intervalForAutoPilot);
        Configurator.centerCamera();

        // check if the sidebar panel is collapsed or not and show close button accordingly

        var elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        }
      }
    }
  });

  const querySt = window.location.href.split("#");
  var model_id = querySt[1];
  $("#" + model_id).click();
});

// when escpae is pressed in full screen mode
$(window).resize(function () {
  if (
    window.fullScreen ||
    (window.innerWidth == screen.width && window.innerHeight == screen.height)
  ) {
    // opens full screen
    $("#sidebar").addClass("active");
    $("#sidebar-right").css({
      display: "none",
    });
    $("#selected_apartment_name").show();
    $("#img-fullscreen").attr("src", "img/Group_FullScreen.svg");

    $("#all-unit-text").css({
      display: "inline-block",
    });
    $("#auto-pilot").hide();
    clearInterval(intervalForAutoPilot);
    Configurator.centerCamera();
  } else {
    // close full screen and opens component of map
    $("#img-fullscreen").attr("src", "img/Group 8434.svg");
    $("#sidebar").removeClass("active");
    $("#sidebar-right").css({
      display: "inline-block",
    });
    $("#selected_apartment_name").hide();
    $("#all-unit-text").css({
      display: "none",
    });
    $("#auto-pilot").show();
    clearInterval(intervalForAutoPilot);
    startAnimation();
    document.getElementById("auto-pilot").style.left = dynamicMarginAutoPilot;
    $("#auto-pilot").css({
      width: 'fit - content'

    });
  }
});

// prevent Auto Started Animation when an annotation is clicked.
function annotationSelect() {
  clearInterval(intervalForAutoPilot);
  stopAnimation = true;
  startAnimation();
  // $(".autostart").css("background-size", "10%");
  // // setting the logo as well
  // $(".autostart").css(
  //   "background",
  //   "url(/static/backend/img/play.svg) #ffffff 6% no-repeat padding-box"
  // );
  // $(".autostart").css("background-size", "10%");
}

function shareModel() {
  // alert ("model is shared.")
  $("#warning").css("display", "none");
  $("#warning").css("display", "inline-block");
  $("#warning").css("opacity", "1");

  setTimeout(function () {
    $("#warning").css("display", "none");
  }, 2000);

  // var selected_model_left = $("ul#models_list_leftpanel").find("li.active");
  // var id = selected_model_left[0].firstElementChild.id;
  // var text_to_copy =
  // 	window.location.origin + window.location.pathname + "#" + id;

  var text_to_copy =
    "https://www.zameen.com/new-projects/business_hub-1969.html#walk_through_popup";

  // debugger;
  document.getElementById("myInput").value = text_to_copy;

  var copyText = document.getElementById("myInput");
  copyText.select();
  copyText.setSelectionRange(0, 99999);
  document.execCommand("copy");
}

var close = document.getElementsByClassName("closebtn");
var i;

for (i = 0; i < close.length; i++) {
  close[i].onclick = function () {
    var div = this.parentElement;
    div.style.opacity = "0";
    setTimeout(function () {
      div.style.display = "none";
    }, 600);
  };
}

$("#sidebarCollapse").on("click", function (e) {
  if (
    !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    if ($("#all-unit-text").is(":visible")) {
      $("#all-unit-text").css({
        display: "none",
      });
    } else {
      $("#all-unit-text").css({
        display: "inline-block",
      });
    }
  }
});


$("#mobile-select-view").click(function () {
  if ($(".project-views").is(":visible")) {
    $("#lower_floor").css({
      display: "none",
    });

    $("#upper_floor").css({
      display: "none",
    });

    $(".project-views").css({
      display: "none",
    });
    $("#mobile-select-view").css({
      bottom: "1%",
    });
    $(".select-view-mobile").removeClass("change");
    $(".select-view-mobile").removeClass("change2");
  } else {

    if (groupLayer) {

      if (SELECTED_MODEL == "groundfloorsomeid") {
        $("#lower_floor").css({
          display: "inherit",
        });
      } else if (SELECTED_MODEL == "firstfloorsomeid") {
        $("#upper_floor").css({
          display: "inherit",
        });
        $("#upper_floor").css({
          left: "3%",
        });
        $(".select-view-mobile").addClass("change2");
      } else {
        $("#upper_floor").css({
          display: "inherit",
        });
        $("#lower_floor").css({
          display: "inherit",
        });
      }
    }

    $(".project-views").css({
      display: "-webkit-box",
    });

    // $(".select-view-mobile").addClass("change2");
    if ($("#lower_floor").is(":visible")) {
      $(".select-view-mobile").addClass("change2");
    } else {
      $(".select-view-mobile").addClass("change");
    }
  }
});

$("#lower_floor").click(function (e) {
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    $("#upper-floor-div").hide();
    $("#lower-floor").click();
  } else {
    $("#lower-floor").click();
  }
});


$("#upper_floor").click(function (e) {
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    $("#lower-floor-div").hide();
    $("#upper-floor").click();
  } else {
    $("#upper-floor").click();
  }
});

$("#api-frame").on("click", function () {
  clearInterval(intervalForAutoPilot);
});

function startAnimation() {
  document.getElementById("auto-pilot").value = "Start Animation";
  stopAnimation = true;
  $(".autostart").css(
    "background",
    "url(/static/backend/img/play.svg) #ffffff 6% no-repeat padding-box"
  );
  $(".autostart").css("background-size", "10%");
}

window.screen.orientation.onchange = function () {
  if (this.type.startsWith("landscape")) {
    document.querySelector("#container").webkitRequestFullscreen();
  } else {
    document.webkitExitFullscreen();
  }
}; 
